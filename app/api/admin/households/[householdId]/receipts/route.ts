import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, users } from '@/lib/db/schema';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    const { householdId } = await params;

    // Get all receipts for the household with submitter email
    const householdReceipts = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        currency: receipts.currency,
        transactionDate: receipts.transactionDate,
        processingStatus: receipts.processingStatus,
        createdAt: receipts.createdAt,
        userId: receipts.userId,
        submitterEmail: users.email,
      })
      .from(receipts)
      .innerJoin(users, eq(receipts.userId, users.id))
      .where(and(
        eq(receipts.householdId, householdId),
        isNull(receipts.deletedAt),
      ))
      .orderBy(receipts.createdAt);

    submitLogEvent('admin', `Admin viewed receipts for household ${householdId}`, correlationId, { adminId: user.id, householdId });

    return NextResponse.json(householdReceipts);
  } catch (error) {
    submitLogEvent('admin', `Error fetching household receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch household receipts' },
      { status: 500 },
    );
  }
}
