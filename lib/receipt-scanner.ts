"use server"

import { db } from "@/lib/db";
import { receipts, receiptItems, users } from "@/lib/db/schema";
import { eq, desc, count, isNull, and } from "drizzle-orm";

export interface GetReceiptsOptions {
  userId: string;
  householdId?: string | null;
  personalOnly?: boolean;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface PaginatedReceipts {
  receipts: any[];
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
  } = options;

  const offset = (page - 1) * limit;

  let userReceipts;
  let totalCount;

  // Build base conditions
  const baseConditions = [
    includeDeleted ? undefined : isNull(receipts.deletedAt),
  ].filter(Boolean);

  if (householdId) {
    // Get receipts for specific household
    const conditions = and(
      eq(receipts.householdId, householdId),
      ...baseConditions
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(desc(receipts.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(receipts)
      .where(conditions);
    totalCount = countResult.count;
  } else if (personalOnly) {
    // Get only personal receipts (not assigned to any household)
    const conditions = and(
      eq(receipts.userId, userId),
      isNull(receipts.householdId),
      ...baseConditions
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(desc(receipts.createdAt))
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
      ...baseConditions
    );

    userReceipts = await db
      .select()
      .from(receipts)
      .where(conditions)
      .orderBy(desc(receipts.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: count() })
      .from(receipts)
      .where(conditions);
    totalCount = countResult.count;
  }

  // Get items and user info for each receipt
  const receiptsWithDetails = await Promise.all(
    userReceipts.map(async (receipt) => {
      const items = await db
        .select()
        .from(receiptItems)
        .where(eq(receiptItems.receiptId, receipt.id));

      // Get user who created the receipt
      const [receiptUser] = await db
        .select({
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, receipt.userId))
        .limit(1);

      return {
        ...receipt,
        items,
        submittedBy: receiptUser?.email || "Unknown",
      };
    })
  );

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
 * Get a single receipt by ID
 */
export async function getReceiptById(receiptId: string, includeDeleted = false) {
  const conditions = includeDeleted
    ? eq(receipts.id, receiptId)
    : and(eq(receipts.id, receiptId), isNull(receipts.deletedAt));

  const [receipt] = await db
    .select()
    .from(receipts)
    .where(conditions)
    .limit(1);

  return receipt || null;
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
