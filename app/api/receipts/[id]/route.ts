import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireReceiptAccess, filterReceiptForSubscription } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { getReceiptById, deleteReceipt } from '@/lib/receipt-scanner';
import { db } from '@/lib/db';
import { receipts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { invalidateInsightsCache } from '@/lib/utils/cache-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: receiptId } = await params;

    const receipt = await getReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 },
      );
    }

    // Verify the user owns this receipt or is admin
    const accessCheck = await requireReceiptAccess(receipt, user, correlationId);
    if (accessCheck) return accessCheck;

    // Filter receipt data based on subscription status
    const filteredReceipt = filterReceiptForSubscription(receipt, user.subscribed);

    return NextResponse.json(filteredReceipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);

    submitLogEvent(
      'receipt-error',
      'Failed to fetch receipt',
      correlationId,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      true,
    );

    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 },
    );
  }
}

// PATCH /api/receipts/[id] - Update receipt (e.g., business expense fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: receiptId } = await params;

    const receipt = await getReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 },
      );
    }

    // Only receipt owner can update business expense fields
    if (receipt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only receipt owner can update this receipt' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      isBusinessExpense,
      businessCategory,
      businessNotes,
      taxDeductible,
    } = body;

    // Build update object
    const updates: Partial<typeof receipts.$inferInsert> = {};

    if (isBusinessExpense !== undefined) updates.isBusinessExpense = isBusinessExpense;
    if (businessCategory !== undefined) updates.businessCategory = businessCategory;
    if (businessNotes !== undefined) updates.businessNotes = businessNotes;
    if (taxDeductible !== undefined) updates.taxDeductible = taxDeductible;

    const [updatedReceipt] = await db
      .update(receipts)
      .set(updates)
      .where(eq(receipts.id, receiptId))
      .returning();

    submitLogEvent(
      'receipt',
      `Updated receipt ${receiptId}`,
      correlationId,
      { receiptId, updates },
    );

    // Filter based on subscription status
    const filteredReceipt = filterReceiptForSubscription(updatedReceipt, user.subscribed);

    return NextResponse.json(filteredReceipt);
  } catch (error) {
    console.error('Error updating receipt:', error);

    submitLogEvent(
      'receipt-error',
      'Failed to update receipt',
      correlationId,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      true,
    );

    return NextResponse.json(
      { error: 'Failed to update receipt' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Await params in Next.js 15+
    const { id: receiptId } = await params;

    // Get the receipt to verify ownership and log details
    const receipt = await getReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 },
      );
    }

    // Verify the user owns this receipt or is admin
    const accessCheck = await requireReceiptAccess(receipt, user, correlationId);
    if (accessCheck) return accessCheck;

    // Soft delete the receipt using helper function
    const deleted = await deleteReceipt(receiptId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete receipt' },
        { status: 500 },
      );
    }

    // Log the deletion
    submitLogEvent(
      'receipt',
      'Receipt soft deleted',
      correlationId,
      {
        receiptId,
        userId: user.id,
        merchantName: receipt.merchantName,
        totalAmount: receipt.totalAmount,
        deletedByAdmin: user.isAdmin && receipt.userId !== user.id,
        receiptOwnerId: receipt.userId,
      },
    );

    // Invalidate insights cache for this user
    await invalidateInsightsCache(user.id, receipt.householdId, correlationId);

    return NextResponse.json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);

    // Get receiptId from params for error logging
    const { id: receiptId } = await params;

    submitLogEvent(
      'receipt-error',
      'Failed to delete receipt',
      correlationId,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        receiptId,
      },
      true, // alert on error
    );

    return NextResponse.json(
      { error: 'Failed to delete receipt' },
      { status: 500 },
    );
  }
}
