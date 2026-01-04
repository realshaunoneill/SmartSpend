import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, users, households } from '@/lib/db/schema';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { sql, eq, isNull, desc } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    // Get receipts with user and household data using JOINs
    const receiptsWithDetails = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        currency: receipts.currency,
        transactionDate: receipts.transactionDate,
        processingStatus: receipts.processingStatus,
        processingError: receipts.processingError,
        category: receipts.category,
        isBusinessExpense: receipts.isBusinessExpense,
        createdAt: receipts.createdAt,
        userEmail: sql<string>`COALESCE(${users.email}, 'Unknown')`,
        householdName: households.name,
      })
      .from(receipts)
      .leftJoin(users, eq(receipts.userId, users.id))
      .leftJoin(households, eq(receipts.householdId, households.id))
      .where(isNull(receipts.deletedAt))
      .orderBy(desc(receipts.createdAt))
      .limit(1000); // Increased limit for better admin view

    submitLogEvent('admin', 'Admin viewed receipts list', correlationId, { adminId: user.id });

    return NextResponse.json(receiptsWithDetails);
  } catch (error) {
    submitLogEvent('admin', `Error fetching receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 },
    );
  }
}
