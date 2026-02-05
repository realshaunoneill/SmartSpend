import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, insightsCache } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription, requireHouseholdMembership } from '@/lib/auth-helpers';
import { eq, and, gte, desc } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';
import { detectSpendingAnomalies } from '@/lib/openai';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const runtime = 'nodejs';

/**
 * GET /api/receipts/anomalies
 * Detect unusual spending patterns and anomalies
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
    const cacheKey = `anomalies:household:${householdId || 'null'}`;

    // Check cache (cache for 30 minutes - anomalies should be relatively fresh)
    const cachedResult = await db
      .select()
      .from(insightsCache)
      .where(
        and(
          eq(insightsCache.userId, user.id),
          eq(insightsCache.cacheType, 'spending_anomalies'),
          eq(insightsCache.cacheKey, cacheKey),
          gte(insightsCache.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (cachedResult.length > 0) {
      submitLogEvent('anomaly', 'Returning cached anomaly detection', correlationId, {
        userId: user.id,
        householdId,
      });
      return NextResponse.json(cachedResult[0].data);
    }

    submitLogEvent('anomaly', 'Running anomaly detection', correlationId, {
      userId: user.id,
      householdId,
    });

    // Get recent transactions (last 30 days)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const recentDateStr = recentDate.toISOString().split('T')[0];

    // Get historical data (90 days before recent period for comparison)
    const historicalStartDate = new Date();
    historicalStartDate.setDate(historicalStartDate.getDate() - 120); // 90 days history + 30 days recent
    const historicalStartDateStr = historicalStartDate.toISOString().split('T')[0];

    // Build conditions
    const baseConditions = householdId
      ? [eq(receipts.userId, user.id), eq(receipts.householdId, householdId)]
      : [eq(receipts.userId, user.id)];

    // Get all transactions for both periods
    const allTransactions = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        transactionDate: receipts.transactionDate,
        category: receipts.category,
        currency: receipts.currency,
      })
      .from(receipts)
      .where(and(...baseConditions, gte(receipts.transactionDate, historicalStartDateStr)))
      .orderBy(desc(receipts.transactionDate));

    if (allTransactions.length < 10) {
      return NextResponse.json({
        analysis: null,
        message: 'Not enough transaction history for anomaly detection. Keep uploading receipts!',
      });
    }

    // Split into recent and historical (transactionDate is stored as text YYYY-MM-DD)
    const recentTransactions = allTransactions.filter(t => t.transactionDate && t.transactionDate >= recentDateStr);
    const historicalTransactions = allTransactions.filter(t => t.transactionDate && t.transactionDate < recentDateStr);

    if (historicalTransactions.length < 5) {
      return NextResponse.json({
        analysis: null,
        message: 'Not enough historical data for comparison. Keep uploading receipts!',
      });
    }

    const currency = allTransactions[0]?.currency || user.currency || DEFAULT_CURRENCY;

    // Calculate historical averages
    const historicalDays = Math.max(1, Math.ceil((recentDate.getTime() - historicalStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    const historicalTotal = historicalTransactions.reduce((sum, t) => sum + parseFloat(t.totalAmount || '0'), 0);
    
    const categoryTotals = new Map<string, number>();
    const merchantData = new Map<string, { total: number; count: number }>();

    for (const t of historicalTransactions) {
      const category = t.category || 'Other';
      const merchant = t.merchantName || 'Unknown';
      const amount = parseFloat(t.totalAmount || '0');

      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      
      const existing = merchantData.get(merchant) || { total: 0, count: 0 };
      merchantData.set(merchant, { total: existing.total + amount, count: existing.count + 1 });
    }

    const historicalMonths = historicalDays / 30;

    const spendingData = {
      recentTransactions: recentTransactions.map(t => ({
        merchant: t.merchantName || 'Unknown',
        amount: parseFloat(t.totalAmount || '0'),
        date: t.transactionDate || 'Unknown',
        category: t.category || 'Other',
      })),
      historicalAverages: {
        dailyAvg: historicalTotal / historicalDays,
        weeklyAvg: (historicalTotal / historicalDays) * 7,
        monthlyAvg: historicalTotal / historicalMonths,
        categoryAverages: Array.from(categoryTotals.entries())
          .map(([category, total]) => ({
            category,
            avgMonthly: total / historicalMonths,
          }))
          .sort((a, b) => b.avgMonthly - a.avgMonthly)
          .slice(0, 10),
        merchantFrequency: Array.from(merchantData.entries())
          .map(([merchant, data]) => ({
            merchant,
            avgVisitsPerMonth: data.count / historicalMonths,
            avgSpend: data.total / data.count,
          }))
          .sort((a, b) => b.avgSpend - a.avgSpend)
          .slice(0, 10),
      },
      currency,
    };

    // Run AI anomaly detection
    const { analysis, usage } = await detectSpendingAnomalies(
      spendingData,
      email,
      user.id,
      correlationId,
    );

    const response = {
      analysis,
      data: {
        recentTransactionCount: recentTransactions.length,
        historicalTransactionCount: historicalTransactions.length,
        currency,
        analyzedPeriod: '30 days',
        comparisonPeriod: '90 days',
      },
      usage,
    };

    // Cache for 30 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    await db
      .insert(insightsCache)
      .values({
        id: randomUUID(),
        userId: user.id,
        cacheType: 'spending_anomalies',
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
    submitLogEvent('anomaly-error', `Failed to detect anomalies: ${message}`, correlationId, {
      error: message,
    }, true);
    return NextResponse.json(
      { error: 'Failed to detect spending anomalies' },
      { status: 500 },
    );
  }
}
