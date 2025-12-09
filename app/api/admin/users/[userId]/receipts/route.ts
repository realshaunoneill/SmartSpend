import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts } from '@/lib/db/schema';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    const { userId } = await params;

    // Get all receipts for the user
    const userReceipts = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        currency: receipts.currency,
        transactionDate: receipts.transactionDate,
        processingStatus: receipts.processingStatus,
        createdAt: receipts.createdAt,
        householdId: receipts.householdId,
      })
      .from(receipts)
      .where(and(
        eq(receipts.userId, userId),
        isNull(receipts.deletedAt),
      ))
      .orderBy(receipts.createdAt);

    submitLogEvent('admin', `Admin viewed receipts for user ${userId}`, correlationId, { adminId: user.id, userId });

    return NextResponse.json(userReceipts);
  } catch (error) {
    submitLogEvent('admin', `Error fetching user receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch user receipts' },
      { status: 500 },
    );
  }
}
