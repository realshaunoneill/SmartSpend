import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { UserService } from '@/lib/services/user-service';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { householdUsers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';

/**
 * Get user email from Clerk
 */
export async function getClerkUserEmail(clerkId: string, correlationId?: CorrelationId): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    return user.emailAddresses[0]?.emailAddress ?? null;
  } catch (error) {
    submitLogEvent('auth', `Error fetching Clerk user: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId || randomUUID() as CorrelationId, { clerkId }, true);
    return null;
  }
}

/**
 * Get or create authenticated user from database
 * Returns user object or NextResponse error
 */
export async function getAuthenticatedUser(correlationId?: CorrelationId) {
  const cid = correlationId || randomUUID() as CorrelationId;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = await getClerkUserEmail(clerkId, cid);
  if (!email) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 });
  }

  try {
    const user = await UserService.getOrCreateUser(clerkId, email);
    return { user, clerkId, email, correlationId: cid };
  } catch (error) {
    submitLogEvent('auth', `Error getting/creating user: ${error instanceof Error ? error.message : 'Unknown error'}`, cid, { clerkId }, true);
    return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
  }
}

/**
 * Check if user has an active subscription
 * Returns null if subscribed, or NextResponse error if not
 */
export async function requireSubscription(userOrResult: any) {
  // If it's already an error response, return it
  if (userOrResult instanceof NextResponse) {
    return userOrResult;
  }

  const user = userOrResult.user || userOrResult;

  const skipSubscriptionCheck = process.env.SKIP_SUBSCRIPTION_CHECK === 'true';

  if (!skipSubscriptionCheck && !user.subscribed) {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Require admin privileges
 * Returns null if admin, or NextResponse error if not
 */
export async function requireAdmin(user: User, correlationId: CorrelationId) {
  const isAdmin = await UserService.isAdmin(user.id);
  if (!isAdmin) {
    submitLogEvent('admin', 'Unauthorized admin access attempt', correlationId, { userId: user.id }, true);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Check if user is member of household
 * Returns membership record or null
 */
export async function getHouseholdMembership(householdId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(householdUsers)
    .where(
      and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, userId),
      ),
    )
    .limit(1);
  return membership || null;
}

/**
 * Require household membership
 * Returns null if member, or NextResponse error if not
 */
export async function requireHouseholdMembership(
  householdId: string,
  userId: string,
  correlationId: CorrelationId,
) {
  const membership = await getHouseholdMembership(householdId, userId);
  if (!membership) {
    submitLogEvent('household', 'Unauthorized household access attempt', correlationId, { userId, householdId }, true);
    return NextResponse.json(
      { error: 'Not a member of this household' },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Verify receipt ownership or admin
 * Returns null if authorized, or NextResponse error if not
 */
export async function requireReceiptAccess(
  receipt: any,
  user: User,
  correlationId: CorrelationId,
) {
  const isAdmin = await UserService.isAdmin(user.id);
  if (receipt.userId !== user.id && !isAdmin) {
    submitLogEvent('receipt', 'Unauthorized receipt access attempt', correlationId, { userId: user.id, receiptId: receipt.id }, true);
    return NextResponse.json(
      { error: "You don't have permission to access this receipt" },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Filter receipt data for non-subscribed users
 * Removes premium features like line items, OCR data, detailed analytics
 */
export function filterReceiptForSubscription(receipt: any, isSubscribed: boolean) {
  if (isSubscribed) {
    return receipt;
  }

  // For non-subscribed users, only return basic receipt info
  return {
    id: receipt.id,
    userId: receipt.userId,
    householdId: receipt.householdId,
    imageUrl: receipt.imageUrl,
    merchantName: receipt.merchantName,
    totalAmount: receipt.totalAmount,
    currency: receipt.currency,
    transactionDate: receipt.transactionDate,
    category: receipt.category,
    processingStatus: receipt.processingStatus,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    submittedBy: receipt.submittedBy,
    // Exclude premium features:
    // - items (line items)
    // - ocrData (detailed OCR response)
    // - paymentMethod
    // - location
    // - tax
    // - serviceCharge
    // - subtotal
    // - receiptNumber
    // - processingTokens
    // - isBusinessExpense
    // - businessCategory
    // - businessNotes
    // - taxDeductible
  };
}

/**
 * Filter multiple receipts for non-subscribed users
 */
export function filterReceiptsForSubscription(receipts: any[], isSubscribed: boolean) {
  if (isSubscribed) {
    return receipts;
  }
  return receipts.map(receipt => filterReceiptForSubscription(receipt, false));
}

