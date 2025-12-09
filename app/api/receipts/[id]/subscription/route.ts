import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { subscriptions, subscriptionPayments, receipts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CorrelationId, submitLogEvent } from '@/lib/logging';

export const runtime = 'nodejs';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/receipts/[id]/subscription - Get subscription linked to this receipt
export async function GET(req: NextRequest, { params }: RouteParams) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  const { id: receiptId } = await params;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Verify receipt ownership
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId));

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    if (receipt.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Find subscription payment linked to this receipt
    const [payment] = await db
      .select({
        id: subscriptionPayments.id,
        subscriptionId: subscriptionPayments.subscriptionId,
        expectedDate: subscriptionPayments.expectedDate,
        expectedAmount: subscriptionPayments.expectedAmount,
        status: subscriptionPayments.status,
        actualDate: subscriptionPayments.actualDate,
        actualAmount: subscriptionPayments.actualAmount,
        subscription: {
          id: subscriptions.id,
          name: subscriptions.name,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
          billingFrequency: subscriptions.billingFrequency,
          status: subscriptions.status,
          isBusinessExpense: subscriptions.isBusinessExpense,
        },
      })
      .from(subscriptionPayments)
      .innerJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
      .where(
        and(
          eq(subscriptionPayments.receiptId, receiptId),
          eq(subscriptions.userId, user.id)
        )
      );

    if (!payment) {
      return NextResponse.json(
        { error: 'No subscription linked to this receipt' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    submitLogEvent('subscription', `Error fetching receipt subscription link: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch subscription link' },
      { status: 500 }
    );
  }
}
