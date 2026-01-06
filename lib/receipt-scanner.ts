'use server';

import { db } from '@/lib/db';
import { receipts, receiptItems, users } from '@/lib/db/schema';
import type { Receipt } from '@/lib/db/schema';
import { eq, desc, asc, count, isNull, and, or, gte, lte, ilike, sql, inArray } from 'drizzle-orm';
import type { ReceiptWithItems } from '@/lib/types/api-responses';

export interface GetReceiptsOptions {
  userId: string;
  householdId?: string | null;
  personalOnly?: boolean;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  // Search and filter options
  search?: string;
  category?: string;
  merchant?: string;
  minAmount?: string;
  maxAmount?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  isBusinessExpense?: string;
  searchAllHouseholds?: boolean; // When true, search across all user's receipts regardless of householdId
}

export interface PaginatedReceipts {
  receipts: ReceiptWithItems[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get receipts with pagination and filtering
 */
export async function getReceipts(options: GetReceiptsOptions): Promise<PaginatedReceipts> {
  const {
    userId,
    householdId,
    personalOnly = false,
    page = 1,
    limit = 10,
    includeDeleted = false,
    search,
    category,
    merchant,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
    isBusinessExpense,
    searchAllHouseholds = false,
  } = options;

  const offset = (page - 1) * limit;

  // Build base conditions
  const baseConditions = [
    includeDeleted ? undefined : isNull(receipts.deletedAt),
  ].filter(Boolean);

  // Build search/filter conditions
  const filterConditions = [];

  // Text search across merchant name, category, and line items
  if (search) {
    // Search in receipt items for matching product names
    // Limit to 1000 to prevent performance issues with large datasets
    const matchingReceiptIds = await db
      .selectDistinct({ receiptId: receiptItems.receiptId })
      .from(receiptItems)
      .where(ilike(receiptItems.name, `%${search}%`))
      .limit(1000)
      .then(rows => rows.map(r => r.receiptId));

    if (matchingReceiptIds.length > 0) {
      filterConditions.push(
        or(
          ilike(receipts.merchantName, `%${search}%`),
          ilike(receipts.category, `%${search}%`),
          inArray(receipts.id, matchingReceiptIds),
        ),
      );
    } else {
      // If no items match, still search merchant and category
      filterConditions.push(
        or(
          ilike(receipts.merchantName, `%${search}%`),
          ilike(receipts.category, `%${search}%`),
        ),
      );
    }
  }

  // Category filter
  if (category) {
    filterConditions.push(ilike(receipts.category, category));
  }

  // Merchant filter
  if (merchant) {
    filterConditions.push(ilike(receipts.merchantName, `%${merchant}%`));
  }

  // Amount range filter
  if (minAmount) {
    filterConditions.push(gte(sql`CAST(${receipts.totalAmount} AS DECIMAL)`, parseFloat(minAmount)));
  }
  if (maxAmount) {
    filterConditions.push(lte(sql`CAST(${receipts.totalAmount} AS DECIMAL)`, parseFloat(maxAmount)));
  }

  // Date range filter
  if (startDate) {
    filterConditions.push(gte(receipts.transactionDate, startDate));
  }
  if (endDate) {
    filterConditions.push(lte(receipts.transactionDate, endDate));
  }

  // Business expense filter
  if (isBusinessExpense === 'true') {
    filterConditions.push(eq(receipts.isBusinessExpense, true));
  } else if (isBusinessExpense === 'false') {
    filterConditions.push(or(eq(receipts.isBusinessExpense, false), isNull(receipts.isBusinessExpense)));
  }

  // Determine sort field and order
  let sortField;
  switch (sortBy) {
    case 'amount':
      sortField = sql`CAST(${receipts.totalAmount} AS DECIMAL)`;
      break;
    case 'merchant':
      sortField = receipts.merchantName;
      break;
    case 'date':
    default:
      sortField = receipts.transactionDate || receipts.createdAt;
      break;
  }
  const orderFn = sortOrder === 'asc' ? asc : desc;

  let userReceipts;
  let totalCount;

  // When searchAllHouseholds is true and there's a search query, ignore household filter
  const shouldSearchAllHouseholds = searchAllHouseholds && search;

  if (householdId && !shouldSearchAllHouseholds) {
    // Get receipts for specific household
    const conditions = and(
      eq(receipts.householdId, householdId),
      ...baseConditions,
      ...filterConditions,
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(orderFn(sortField))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(receipts)
      .where(conditions);
    totalCount = countResult.count;
  } else if (personalOnly && !shouldSearchAllHouseholds) {
    // Get only personal receipts (not assigned to any household)
    const conditions = and(
      eq(receipts.userId, userId),
      isNull(receipts.householdId),
      ...baseConditions,
      ...filterConditions,
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(orderFn(sortField))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(receipts)
      .where(conditions);
    totalCount = countResult.count;
  } else {
    // Get all receipts for the user (personal + household)
    const conditions = and(
      eq(receipts.userId, userId),
      ...baseConditions,
      ...filterConditions,
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(orderFn(sortField))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(receipts)
      .where(conditions);
    totalCount = countResult.count;
  }

  // Get items and user info for all receipts in batch (avoid N+1 queries)
  const receiptIds = userReceipts.map(r => r.id);
  const userIds = [...new Set(userReceipts.map(r => r.userId))];

  // Batch fetch all items for all receipts
  const allItems = receiptIds.length > 0 
    ? await db
        .select()
        .from(receiptItems)
        .where(inArray(receiptItems.receiptId, receiptIds))
    : [];

  // Batch fetch all users
  const allUsers = userIds.length > 0
    ? await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];

  // Create lookup maps for O(1) access
  const itemsByReceiptId = new Map<string, typeof allItems>();
  allItems.forEach(item => {
    const existing = itemsByReceiptId.get(item.receiptId) || [];
    existing.push(item);
    itemsByReceiptId.set(item.receiptId, existing);
  });

  const userEmailById = new Map<string, string>();
  allUsers.forEach(user => {
    userEmailById.set(user.id, user.email);
  });

  // Build receipts with details using lookup maps (no additional queries)
  const receiptsWithDetails = userReceipts.map((receipt) => ({
    ...receipt,
    items: itemsByReceiptId.get(receipt.id) || [],
    submittedBy: userEmailById.get(receipt.userId) || 'Unknown',
  }));

  return {
    receipts: receiptsWithDetails,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Get receipts for a user (legacy - use getReceipts instead)
 * @deprecated Use getReceipts with options instead
 */
export async function getUserReceipts(userId: string) {
  return await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.userId, userId), isNull(receipts.deletedAt)))
    .orderBy(desc(receipts.createdAt));
}

/**
 * Get receipts for a household (legacy - use getReceipts instead)
 * @deprecated Use getReceipts with options instead
 */
export async function getHouseholdReceipts(householdId: string) {
  return await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.householdId, householdId), isNull(receipts.deletedAt)))
    .orderBy(desc(receipts.createdAt));
}

/**
 * Get a single receipt by ID with items and user info
 * Optimized to use batch queries instead of sequential queries
 */
export async function getReceiptById(receiptId: string, includeDeleted = false): Promise<ReceiptWithItems | null> {
  const conditions = includeDeleted
    ? eq(receipts.id, receiptId)
    : and(eq(receipts.id, receiptId), isNull(receipts.deletedAt));

  // Fetch receipt with user email in a single query using join
  const [receiptWithUser] = await db
    .select({
      receipt: receipts,
      userEmail: users.email,
    })
    .from(receipts)
    .leftJoin(users, eq(receipts.userId, users.id))
    .where(conditions)
    .limit(1);

  if (!receiptWithUser) {
    return null;
  }

  // Fetch items (this is a separate query but unavoidable for 1-to-many)
  const items = await db
    .select()
    .from(receiptItems)
    .where(eq(receiptItems.receiptId, receiptId));

  return {
    ...receiptWithUser.receipt,
    items,
    submittedBy: receiptWithUser.userEmail || 'Unknown',
  };
}

/**
 * Soft delete a receipt
 */
export async function deleteReceipt(receiptId: string, userId: string): Promise<boolean> {
  // Verify ownership
  const receipt = await getReceiptById(receiptId);
  if (!receipt || receipt.userId !== userId) {
    return false;
  }

  // Soft delete
  await db
    .update(receipts)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(receipts.id, receiptId));

  return true;
}
