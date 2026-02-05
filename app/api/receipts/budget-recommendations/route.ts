import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, insightsCache } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription, requireHouseholdMembership } from '@/lib/auth-helpers';
import { eq, and, gte, desc } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';
import { generateBudgetRecommendations } from '@/lib/openai';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const runtime = 'nodejs';

/**
 * GET /api/receipts/budget-recommendations
 * Get AI-powered budget recommendations based on spending history
 * Query params:
 * - householdId: string (optional) - Filter by household
 * - months: number (optional, default: 3) - Number of months to analyze
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
    const months = parseInt(searchParams.get('months') || '3');

    // If householdId is provided, verify user is a member
    if (householdId) {
      const membershipCheck = await requireHouseholdMembership(householdId, user.id, correlationId);
      if (membershipCheck) return membershipCheck;
    }

    // Create cache key
    const cacheKey = `budget:months:${months}|household:${householdId || 'null'}`;

    // Check cache first (cache for 1 hour since budgets don't change frequently)
    const cachedResult = await db
      .select()
      .from(insightsCache)
      .where(
        and(
          eq(insightsCache.userId, user.id),
          eq(insightsCache.cacheType, 'budget_recommendations'),
          eq(insightsCache.cacheKey, cacheKey),
          gte(insightsCache.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (cachedResult.length > 0) {
      submitLogEvent('budget', 'Returning cached budget recommendations', correlationId, {
        userId: user.id,
        householdId,
        months,
      });
      return NextResponse.json(cachedResult[0].data);
    }

    submitLogEvent('budget', 'Generating budget recommendations', correlationId, {
      userId: user.id,
      householdId,
      months,
    });

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Build conditions
    const conditions = [
      eq(receipts.userId, user.id),
      gte(receipts.transactionDate, startDateStr),
    ];

    if (householdId) {
      conditions.push(eq(receipts.householdId, householdId));
    }

    // Get all receipts with items for the period
    const allReceipts = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        transactionDate: receipts.transactionDate,
        category: receipts.category,
        currency: receipts.currency,
      })
      .from(receipts)
      .where(and(...conditions))
      .orderBy(desc(receipts.transactionDate));

    if (allReceipts.length === 0) {
      return NextResponse.json({
        recommendation: null,
        message: 'Not enough data to generate budget recommendations. Upload more receipts to get started.',
      });
    }

    // Calculate monthly spending trend
    const monthlySpending = new Map<string, number>();
    const categoryTotals = new Map<string, number>();
    const merchantData = new Map<string, { total: number; count: number }>();

    for (const receipt of allReceipts) {
      // transactionDate is stored as text (YYYY-MM-DD format)
      const monthKey = receipt.transactionDate?.slice(0, 7) || 'Unknown'; // YYYY-MM
      const amount = parseFloat(receipt.totalAmount || '0');
      const category = receipt.category || 'Other';
      const merchant = receipt.merchantName || 'Unknown';

      monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + amount);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      
      const existing = merchantData.get(merchant) || { total: 0, count: 0 };
      merchantData.set(merchant, { total: existing.total + amount, count: existing.count + 1 });
    }

    // Format data for AI
    const totalSpent = Array.from(monthlySpending.values()).reduce((a, b) => a + b, 0);
    const currency = allReceipts[0]?.currency || user.currency || DEFAULT_CURRENCY;

    const spendingData = {
      monthlySpending: Array.from(monthlySpending.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      categoryBreakdown: Array.from(categoryTotals.entries())
        .map(([category, total]) => ({
          category,
          total,
          avgMonthly: total / months,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      topMerchants: Array.from(merchantData.entries())
        .map(([merchant, data]) => ({
          merchant,
          total: data.total,
          frequency: data.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      totalSpent,
      months,
      currency,
    };

    // Generate AI recommendations
    const { recommendation, usage } = await generateBudgetRecommendations(
      spendingData,
      email,
      user.id,
      correlationId,
    );

    const response = {
      recommendation,
      data: {
        totalSpent,
        avgMonthly: totalSpent / months,
        currency,
        months,
        receiptCount: allReceipts.length,
      },
      usage,
    };

    // Cache for 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db
      .insert(insightsCache)
      .values({
        id: randomUUID(),
        userId: user.id,
        cacheType: 'budget_recommendations',
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
    submitLogEvent('budget-error', `Failed to generate budget recommendations: ${message}`, correlationId, {
      error: message,
    }, true);
    return NextResponse.json(
      { error: 'Failed to generate budget recommendations' },
      { status: 500 },
    );
  }
}
