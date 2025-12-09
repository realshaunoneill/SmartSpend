import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { subscriptions, subscriptionPayments } from '@/lib/db/schema';
import { eq, and, or, desc, isNull, gte, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { CorrelationId, submitLogEvent } from '@/lib/logging';

export const runtime = 'nodejs';

// GET /api/subscriptions - List all subscriptions
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');
    const status = searchParams.get('status'); // 'active', 'paused', 'cancelled'
    const includePayments = searchParams.get('includePayments') === 'true';

    // Build query conditions
    const conditions = [eq(subscriptions.userId, user.id)];
    
    if (householdId) {
      conditions.push(eq(subscriptions.householdId, householdId));
    }
    
    if (status) {
      conditions.push(eq(subscriptions.status, status));
    }

    // Fetch subscriptions
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(...conditions))
      .orderBy(desc(subscriptions.nextBillingDate));

    // Optionally include payment information
    if (includePayments) {
      // Get all subscription IDs
      const subscriptionIds = userSubscriptions.map(s => s.id);
      
      // Fetch all payments in one query
      const allPayments = subscriptionIds.length > 0 ? await db
        .select()
        .from(subscriptionPayments)
        .where(
          and(
            sql`${subscriptionPayments.subscriptionId} = ANY(${subscriptionIds})`,
            or(
              eq(subscriptionPayments.status, 'pending'),
              eq(subscriptionPayments.status, 'missed')
            )
          )
        )
        .orderBy(desc(subscriptionPayments.expectedDate))
        .limit(12 * subscriptionIds.length) : [];

      // Group payments by subscription ID
      const paymentsBySubscription = new Map<string, typeof allPayments>();
      allPayments.forEach(payment => {
        if (!paymentsBySubscription.has(payment.subscriptionId)) {
          paymentsBySubscription.set(payment.subscriptionId, []);
        }
        const subPayments = paymentsBySubscription.get(payment.subscriptionId)!;
        if (subPayments.length < 12) {
          subPayments.push(payment);
        }
      });

      // Map payments to subscriptions
      const subsWithPayments = userSubscriptions.map(subscription => {
        const payments = paymentsBySubscription.get(subscription.id) || [];
        return {
          ...subscription,
          missingPayments: payments.filter(p => p.status === 'pending' || p.status === 'missed').length,
          recentPayments: payments,
        };
      });
      
      return NextResponse.json(subsWithPayments);
    }

    return NextResponse.json(userSubscriptions);
  } catch (error) {
    submitLogEvent('subscription', `Error fetching subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await req.json();
    const {
      name,
      description,
      category,
      amount,
      currency = 'EUR',
      billingFrequency,
      billingDay,
      customFrequencyDays,
      startDate,
      householdId,
      isBusinessExpense = false,
      website,
      notes,
    } = body;

    // Validation
    if (!name || !amount || !billingFrequency || !billingDay || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, amount, billingFrequency, billingDay, startDate' },
        { status: 400 }
      );
    }

    // Calculate next billing date
    const start = new Date(startDate);
    const nextBilling = new Date(start);
    
    if (billingFrequency === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else if (billingFrequency === 'quarterly') {
      nextBilling.setMonth(nextBilling.getMonth() + 3);
    } else if (billingFrequency === 'yearly') {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    } else if (billingFrequency === 'custom' && customFrequencyDays) {
      nextBilling.setDate(nextBilling.getDate() + customFrequencyDays);
    }

    // Create subscription
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        householdId: householdId || null,
        name,
        description,
        category,
        amount,
        currency,
        billingFrequency,
        billingDay,
        customFrequencyDays,
        startDate: start,
        nextBillingDate: nextBilling,
        isBusinessExpense,
        website,
        notes,
      })
      .returning();

    // Generate initial expected payment
    await db.insert(subscriptionPayments).values({
      subscriptionId: newSubscription.id,
      expectedDate: nextBilling,
      expectedAmount: amount,
      status: 'pending',
    });

    submitLogEvent('subscription', `Created subscription: ${name}`, correlationId, { subscriptionId: newSubscription.id });
    
    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    submitLogEvent('subscription', `Error creating subscription: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
