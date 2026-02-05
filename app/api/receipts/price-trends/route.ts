import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, receiptItems, householdUsers, insightsCache } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription, requireHouseholdMembership } from '@/lib/auth-helpers';
import { eq, desc, and, isNull, inArray, gte } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

interface PricePoint {
  date: string;
  price: number;
  merchantName: string;
  quantity: string;
}

interface ItemTrend {
  itemName: string;
  priceHistory: PricePoint[];
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  bestDeal: {
    merchant: string;
    price: number;
    date: string;
  };
}

/**
 * GET /api/receipts/price-trends
 * Get price trends for frequently purchased items
 * Query params:
 * - householdId: string (optional) - Filter by household
 * - itemName: string (optional) - Search for specific item
 * - limit: number (optional, default: 10) - Max items to return
 */
export async function GET(request: NextRequest) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is subscribed
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get('householdId');
    const itemName = searchParams.get('itemName');
    const limit = parseInt(searchParams.get('limit') || '10');

    // If householdId is provided, verify user is a member
    if (householdId) {
      const membershipCheck = await requireHouseholdMembership(householdId, user.id, correlationId);
      if (membershipCheck) return membershipCheck;
    }

    // Create cache key (only cache when not searching for specific item)
    const cacheKey = `price-trends:household:${householdId || 'null'}|limit:${limit}`;

    // Check cache (cache for 2 hours) - only if not searching for specific item
    if (!itemName) {
      const cachedResult = await db
        .select()
        .from(insightsCache)
        .where(
          and(
            eq(insightsCache.userId, user.id),
            eq(insightsCache.cacheType, 'price_trends'),
            eq(insightsCache.cacheKey, cacheKey),
            gte(insightsCache.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (cachedResult.length > 0) {
        submitLogEvent('price-trends', 'Returning cached price trends', correlationId, {
          userId: user.id,
          householdId,
        });
        return NextResponse.json(cachedResult[0].data);
      }
    }

    submitLogEvent('price-trends', 'Fetching price trends', correlationId, { userId: user.id, householdId, itemName });

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

    // Build receipt query conditions
    const conditions = [
      eq(receipts.processingStatus, 'completed'),
      isNull(receipts.deletedAt),
    ];

    if (accessibleHouseholdIds.length > 0) {
      conditions.push(inArray(receipts.householdId, accessibleHouseholdIds));
    } else {
      conditions.push(eq(receipts.userId, user.id));
    }

    // Get all receipts with items
    const allReceipts = await db
      .select({
        receipt: receipts,
        item: receiptItems,
      })
      .from(receipts)
      .innerJoin(receiptItems, eq(receipts.id, receiptItems.receiptId))
      .where(and(...conditions))
      .orderBy(desc(receipts.transactionDate));

    // Group items by normalized name
    const itemGroups = new Map<string, PricePoint[]>();

    for (const { receipt, item } of allReceipts) {
      // Normalize item name for grouping
      const normalizedName = normalizeItemName(item.name);

      // If specific item requested, filter
      if (itemName && !normalizedName.toLowerCase().includes(itemName.toLowerCase())) {
        continue;
      }

      const price = parseFloat(item.totalPrice || item.price || item.unitPrice || '0');
      if (price <= 0 || isNaN(price)) continue;

      const pricePoint: PricePoint = {
        date: receipt.transactionDate || receipt.createdAt.toISOString().split('T')[0],
        price,
        merchantName: receipt.merchantName || 'Unknown',
        quantity: item.quantity || '1',
      };

      const existing = itemGroups.get(normalizedName);
      if (existing) {
        existing.push(pricePoint);
      } else {
        itemGroups.set(normalizedName, [pricePoint]);
      }
    }

    // Filter to items with multiple price points (to show trends)
    const trendingItems: ItemTrend[] = [];

    for (const [name, priceHistory] of itemGroups.entries()) {
      if (priceHistory.length < 2) continue;

      // Sort by date
      priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const prices = priceHistory.map(p => p.price);
      const currentPrice = prices[prices.length - 1];
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Calculate price change from first to last
      const firstPrice = prices[0];
      const priceChange = currentPrice - firstPrice;
      const priceChangePercent = (priceChange / firstPrice) * 100;

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (priceChangePercent > 5) trend = 'up';
      else if (priceChangePercent < -5) trend = 'down';

      // Find best deal
      const lowestPricePoint = priceHistory.reduce((min, p) =>
        p.price < min.price ? p : min,
      );

      trendingItems.push({
        itemName: name,
        priceHistory,
        currentPrice,
        lowestPrice,
        highestPrice,
        averagePrice,
        priceChange,
        priceChangePercent,
        trend,
        bestDeal: {
          merchant: lowestPricePoint.merchantName,
          price: lowestPricePoint.price,
          date: lowestPricePoint.date,
        },
      });
    }

    // Sort by number of price points (most tracked items first)
    trendingItems.sort((a, b) => b.priceHistory.length - a.priceHistory.length);

    // Limit results
    const limitedTrends = trendingItems.slice(0, limit);

    const response = {
      trends: limitedTrends,
      totalItemsTracked: trendingItems.length,
    };

    submitLogEvent('price-trends', 'Price trends retrieved successfully', correlationId, {
      userId: user.id,
      itemCount: limitedTrends.length,
    });

    // Cache for 2 hours (only if not searching for specific item)
    if (!itemName) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      await db
        .insert(insightsCache)
        .values({
          id: randomUUID(),
          userId: user.id,
          householdId: householdId || undefined,
          cacheType: 'price_trends',
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
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    submitLogEvent('price-trends-error', `Error fetching price trends: ${message}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch price trends' },
      { status: 500 },
    );
  }
}

// Normalize item names for better grouping
function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    // Remove common suffixes like sizes, weights
    .replace(/\s*\d+\s*(oz|ml|g|kg|lb|ct|pk|pack)\b/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Capitalize first letter of each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
