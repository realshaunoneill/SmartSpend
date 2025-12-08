import { db } from '@/lib/db';
import { insightsCache } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { CorrelationId, submitLogEvent } from '@/lib/logging';

/**
 * Invalidate insights cache for user and optionally household
 * Silently fails if cache invalidation errors (logs but doesn't throw)
 */
export async function invalidateInsightsCache(
  userId: string,
  householdId: string | null | undefined,
  correlationId: CorrelationId
) {
  try {
    await db
      .delete(insightsCache)
      .where(
        or(
          eq(insightsCache.userId, userId),
          householdId ? eq(insightsCache.householdId, householdId) : undefined
        )
      );
    submitLogEvent('cache', 'Invalidated insights cache', correlationId, { userId, householdId });
  } catch (error) {
    submitLogEvent(
      'cache-error',
      `Failed to invalidate insights cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
      correlationId,
      { userId, householdId },
      true
    );
  }
}
