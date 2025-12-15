import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireSubscription } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { subscriptions, subscriptionPayments, receipts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { invalidateInsightsCache } from '@/lib/utils/cache-helpers';
import { SubscriptionService } from '@/lib/services/subscription-service';

export const runtime = 'nodejs';

type RouteParams = {
  params: Promise<{
    paymentId: string;
  }>;
};

// PATCH /api/subscriptions/payments/[paymentId] - Link receipt to payment or update status
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  const { paymentId } = await params;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Require active subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    const body = await req.json();
    const { receiptId, status, actualDate, actualAmount, notes } = body;

    // Fetch payment and verify ownership through subscription
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .innerJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
      .where(
        and(
          eq(subscriptionPayments.id, paymentId),
          eq(subscriptions.userId, user.id),
        ),
      );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      );
    }

    // If linking a receipt, verify ownership
    if (receiptId) {
      const [receipt] = await db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.id, receiptId),
            eq(receipts.userId, user.id),
          ),
        );

      if (!receipt) {
        return NextResponse.json(
          { error: 'Receipt not found or unauthorized' },
          { status: 404 },
        );
      }

      // Auto-populate actual date and amount from receipt if not provided
      const updates: Partial<typeof subscriptionPayments.$inferInsert> = {
        receiptId,
        actualDate: actualDate ? new Date(actualDate) : (receipt.transactionDate ? new Date(receipt.transactionDate) : new Date()),
        actualAmount: actualAmount?.toString() ?? receipt.totalAmount ?? '0',
        status: status || 'paid', // Default to paid when linking receipt
      };

      if (notes !== undefined) updates.notes = notes;

      const [updated] = await db
        .update(subscriptionPayments)
        .set(updates)
        .where(eq(subscriptionPayments.id, paymentId))
        .returning();

      submitLogEvent('subscription', `Linked receipt ${receiptId} to payment ${paymentId}`, correlationId, { paymentId, receiptId });

      // If payment is marked as paid, update subscription and generate next payment
      if (updates.status === 'paid' && updates.actualDate) {
        await SubscriptionService.handlePaymentPaid(
          payment.subscription_payments.subscriptionId,
          new Date(updates.actualDate),
        );
        submitLogEvent('subscription', `Generated next payment for subscription ${payment.subscription_payments.subscriptionId}`, correlationId);
      }

      // Invalidate insights cache
      await invalidateInsightsCache(user.id, payment.subscriptions.householdId || undefined, correlationId);

      return NextResponse.json(updated);
    }

    // Otherwise just update payment details
    const updates: Partial<typeof subscriptionPayments.$inferInsert> = {};

    if (status !== undefined) updates.status = status;
    if (actualDate !== undefined) updates.actualDate = actualDate ? new Date(actualDate) : null;
    if (actualAmount !== undefined) updates.actualAmount = actualAmount;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(subscriptionPayments)
      .set(updates)
      .where(eq(subscriptionPayments.id, paymentId))
      .returning();

    submitLogEvent('subscription', `Updated payment ${paymentId}`, correlationId, { paymentId });

    // If payment is marked as paid, update subscription and generate next payment
    if (updates.status === 'paid' && updates.actualDate) {
      await SubscriptionService.handlePaymentPaid(
        payment.subscription_payments.subscriptionId,
        new Date(updates.actualDate),
      );
      submitLogEvent('subscription', `Generated next payment for subscription ${payment.subscription_payments.subscriptionId}`, correlationId);
    }

    // Invalidate insights cache
    await invalidateInsightsCache(user.id, payment.subscriptions.householdId || undefined, correlationId);

    return NextResponse.json(updated);
  } catch (error) {
    submitLogEvent('subscription', `Error updating payment: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 },
    );
  }
}

// DELETE /api/subscriptions/payments/[paymentId] - Unlink receipt from payment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  const { paymentId } = await params;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Require active subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    // Fetch payment and verify ownership
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .innerJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
      .where(
        and(
          eq(subscriptionPayments.id, paymentId),
          eq(subscriptions.userId, user.id),
        ),
      );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 },
      );
    }

    // Unlink receipt and reset to pending
    const [updated] = await db
      .update(subscriptionPayments)
      .set({
        receiptId: null,
        actualDate: null,
        actualAmount: null,
        status: 'pending',
      })
      .where(eq(subscriptionPayments.id, paymentId))
      .returning();

    submitLogEvent('subscription', `Unlinked receipt from payment ${paymentId}`, correlationId, { paymentId });

    // Invalidate insights cache
    await invalidateInsightsCache(user.id, payment.subscriptions.householdId || undefined, correlationId);

    return NextResponse.json(updated);
  } catch (error) {
    submitLogEvent('subscription', `Error unlinking payment: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to unlink payment' },
      { status: 500 },
    );
  }
}
