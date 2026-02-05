import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, insightsCache, subscriptions, householdUsers } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription, requireHouseholdMembership } from '@/lib/auth-helpers';
import { eq, and, gte, desc, inArray, isNull } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';
import { generateSpendingForecast } from '@/lib/openai';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const runtime = 'nodejs';

/**
 * GET /api/receipts/forecast
 * Get AI-powered spending forecast
 * Query params:
 * - householdId: string (optional) - Filter by household
 */
export async function GET(request: NextRequest) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user, email } = authResult;

    // Check if user is subscribed
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');

    // If householdId is provided, verify user is a member
    if (householdId) {
      const membershipCheck = await requireHouseholdMembership(householdId, user.id, correlationId);
      if (membershipCheck) return membershipCheck;
    }

    // Create cache key
    const cacheKey = `forecast:household:${householdId || 'null'}`;

    // Check cache (cache for 6 hours - forecasts don't change rapidly)
    const cachedResult = await db
      .select()
      .from(insightsCache)
      .where(
        and(
          eq(insightsCache.userId, user.id),
          eq(insightsCache.cacheType, 'spending_forecast'),
          eq(insightsCache.cacheKey, cacheKey),
          gte(insightsCache.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (cachedResult.length > 0) {
      submitLogEvent('forecast', 'Returning cached spending forecast', correlationId, {
        userId: user.id,
        householdId,
      });
      return NextResponse.json(cachedResult[0].data);
    }

    submitLogEvent('forecast', 'Generating spending forecast', correlationId, { userId: user.id, householdId });

    // Get accessible household IDs
    const accessibleHouseholdIds: string[] = [];

    if (householdId) {
      accessibleHouseholdIds.push(householdId);
    } else {
      // Get all household IDs the user has access to
      const memberships = await db
        .select({ householdId: householdUsers.householdId })
        .from(householdUsers)
        .where(eq(householdUsers.userId, user.id));

      accessibleHouseholdIds.push(...memberships.map(m => m.householdId));
    }

    // Calculate date range (6 months back)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDateStr = sixMonthsAgo.toISOString().split('T')[0];

    // Build receipt query conditions
    const conditions = [
      eq(receipts.processingStatus, 'completed'),
      isNull(receipts.deletedAt),
      gte(receipts.transactionDate, startDateStr),
    ];

    if (accessibleHouseholdIds.length > 0) {
      conditions.push(inArray(receipts.householdId, accessibleHouseholdIds));
    } else {
      conditions.push(eq(receipts.userId, user.id));
    }

    // Get receipts for the period
    const allReceipts = await db
      .select()
      .from(receipts)
      .where(and(...conditions))
      .orderBy(desc(receipts.transactionDate));

    if (allReceipts.length < 5) {
      return NextResponse.json({
        forecast: null,
        message: 'Not enough data for forecast. Need at least 5 receipts.',
      });
    }

    // Group receipts by month
    const monthlyData = new Map<string, { total: number; categories: Map<string, number> }>();

    for (const receipt of allReceipts) {
      const date = receipt.transactionDate || receipt.createdAt.toISOString().split('T')[0];
      const monthKey = date.substring(0, 7); // YYYY-MM
      const amount = parseFloat(receipt.totalAmount || '0');
      const category = receipt.category || 'other';

      const existing = monthlyData.get(monthKey) || { total: 0, categories: new Map() };
      existing.total += amount;
      existing.categories.set(category, (existing.categories.get(category) || 0) + amount);
      monthlyData.set(monthKey, existing);
    }

    // Convert to array format for AI
    const monthlyHistory = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total: data.total,
        categories: Array.from(data.categories.entries()).map(([category, amount]) => ({
          category,
          amount,
        })),
      }));

    // Get recurring subscriptions
    let recurringExpenses: Array<{ merchant: string; amount: number; frequency: string; category: string }> = [];

    try {
      const activeSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, user.id),
            eq(subscriptions.status, 'active'),
          ),
        );

      recurringExpenses = activeSubscriptions.map(sub => ({
        merchant: sub.name,
        amount: parseFloat(sub.amount),
        frequency: sub.billingFrequency || 'monthly',
        category: sub.category || 'subscription',
      }));
    } catch {
      // Subscriptions table might not exist
    }

    const currency = user.currency || DEFAULT_CURRENCY;

    // Generate AI forecast
    const forecastResult = await generateSpendingForecast(
      {
        monthlyHistory,
        recentRecurring: recurringExpenses,
        currency,
        currentMonth: now.getMonth(),
      },
      email,
      user.id,
      correlationId,
    );

    const response = {
      forecast: forecastResult.analysis,
      usage: forecastResult.usage,
      monthsAnalyzed: monthlyHistory.length,
      currency,
    };

    submitLogEvent('forecast', 'Forecast generated successfully', correlationId, {
      userId: user.id,
      monthsAnalyzed: monthlyHistory.length,
      predictedTotal: forecastResult.analysis.nextMonthTotal,
    });

    // Cache for 6 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await db
      .insert(insightsCache)
      .values({
        id: randomUUID(),
        userId: user.id,
        householdId: householdId || undefined,
        cacheType: 'spending_forecast',
        cacheKey,
        data: response,
        expiresAt,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [insightsCache.userId, insightsCache.cacheType, insightsCache.cacheKey],
        set: {
          data: response,
          expiresAt,
          createdAt: new Date(),
        },
      });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    submitLogEvent('forecast-error', `Error generating forecast: ${message}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to generate spending forecast' },
      { status: 500 },
    );
  }
}
