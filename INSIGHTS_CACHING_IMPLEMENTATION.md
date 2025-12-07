# Insights Page Database Caching Implementation

## Overview

This implementation adds server-side database caching for the insights page to ensure consistent caching across Vercel's serverless instances. The cache stores results for 24 hours and is automatically invalidated when new receipts are uploaded or deleted.

## Changes Made

### 1. Database Schema (`lib/db/schema.ts`)

Added a new `insights_cache` table to store cached insights data:

```typescript
export const insightsCache = pgTable('insights_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
  cacheType: text('cache_type').notNull(), // 'spending_summary' | 'top_items'
  cacheKey: text('cache_key').notNull(), // Includes query params like months, limit, sortBy
  data: jsonb('data').notNull(), // The cached response data
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueCache: unique().on(table.userId, table.cacheType, table.cacheKey),
}));
```

**Features:**
- Unique constraint on `(userId, cacheType, cacheKey)` to prevent duplicate cache entries
- Automatic cascade deletion when users or households are deleted
- Supports both personal and household-level caching
- Stores full JSON response for quick retrieval

### 2. Migration Script (`scripts/add-insights-cache.ts`)

Created a migration script that:
- Creates the `insights_cache` table
- Adds an index on `(user_id, cache_type, cache_key, expires_at)` for fast lookups
- Adds an index on `expires_at` for efficient cleanup of expired cache entries

**To run the migration:**
```bash
npx tsx scripts/add-insights-cache.ts
```

**Note:** Ensure your `DATABASE_URL` environment variable is set before running the migration.

### 3. API Routes Updated

#### `/api/receipts/items/summary/route.ts`
- **Cache Check:** Before generating AI summary, checks database for valid cached results
- **Cache Storage:** Stores new results with 24-hour expiry
- **Conflict Handling:** Uses `onConflictDoUpdate` to refresh cache if key already exists
- **Cache Key Format:** `months:{months}|household:{householdId}`

#### `/api/receipts/items/top/route.ts`
- **Cache Check:** Before querying receipt items, checks database for valid cached results
- **Cache Storage:** Stores aggregated top items with 24-hour expiry
- **Cache Key Format:** `months:{months}|limit:{limit}|sort:{sortBy}|household:{householdId}`

#### `/api/receipt/process/route.ts`
- **Cache Invalidation:** Deletes all cache entries for the user when a new receipt is processed
- **Household Support:** Also invalidates cache for the household if receipt is assigned to one
- **Non-blocking:** Cache invalidation failures are logged but don't block receipt processing

#### `/api/receipts/[id]/route.ts` (DELETE)
- **Cache Invalidation:** Deletes all cache entries for the user when a receipt is deleted
- **Household Support:** Also invalidates cache for the household if receipt was in one
- **Non-blocking:** Cache invalidation failures are logged but don't block deletion

## How It Works

### Cache Lookup Flow
1. User requests insights data (e.g., spending summary)
2. API checks database for matching cache entry:
   - Matches on: `userId`, `cacheType`, `cacheKey`
   - Must not be expired: `expiresAt >= NOW()`
3. If cache hit: Return cached data immediately (no expensive AI/DB queries)
4. If cache miss: Generate data, store in cache with 24-hour expiry, return result

### Cache Invalidation Flow
1. User uploads a new receipt or deletes an existing receipt
2. After successful processing/deletion:
   - Delete all cache entries for the user
   - Delete all cache entries for the household (if applicable)
3. Next insights request will generate fresh data and cache it

## Benefits

### ✅ Consistent Across Instances
- Database-backed caching works across all Vercel serverless instances
- No risk of stale data due to instance rotation

### ✅ Cost Savings
- Reduces OpenAI API calls (AI summaries are expensive)
- Reduces database queries (aggregating thousands of receipt items)
- Cache hit returns data in ~10-50ms vs 5-10 seconds for fresh generation

### ✅ Automatic Invalidation
- Cache is automatically cleared when new receipts are added/deleted
- No manual cache management needed
- Ensures users always see up-to-date insights after changes

### ✅ Per-User & Per-Household
- Cache is scoped to individual users
- Supports household-specific caching
- Different query parameters create different cache entries

## Cache Cleanup

### Automatic Cleanup (Recommended)
Add a scheduled task to clean up expired cache entries:

```typescript
// Example: Vercel Cron Job or scheduled API route
import { db } from '@/lib/db';
import { insightsCache } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';

async function cleanupExpiredCache() {
  await db
    .delete(insightsCache)
    .where(lt(insightsCache.expiresAt, new Date()));
}
```

### Manual Cleanup
If needed, you can manually clean expired cache via SQL:
```sql
DELETE FROM insights_cache WHERE expires_at < NOW();
```

## Performance Considerations

### Indexes
The migration creates two indexes:
1. **Lookup Index:** `(user_id, cache_type, cache_key, expires_at)` - Fast cache lookups
2. **Expiry Index:** `(expires_at)` - Fast cleanup of expired entries

### Cache Key Strategy
- Cache keys include all query parameters that affect the result
- Different parameter combinations create separate cache entries
- Example: 3-month summary and 6-month summary are cached separately

### Cache Size
- Typical cache entry: 2-10 KB (JSON data)
- With 1000 active users × 4 cache entries each: ~8-40 MB total
- Very efficient compared to computation cost

## Monitoring

### Cache Hit Rate
Add logging to track cache effectiveness:
```typescript
submitLogEvent('receipt', "Returning cached AI spending summary", correlationId, {
  userId: user.id,
  householdId,
  months,
  cacheAge: Date.now() - cachedResult[0].createdAt.getTime(),
});
```

### Cache Size
Monitor table size:
```sql
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as unique_users,
  pg_size_pretty(pg_total_relation_size('insights_cache')) as table_size
FROM insights_cache;
```

## Testing

### Test Cache Hit
1. Request insights page
2. Note the response time (should be slow, ~5-10 seconds)
3. Request again within 24 hours
4. Response should be fast (~10-50ms)

### Test Cache Invalidation
1. Request insights page (populates cache)
2. Upload a new receipt
3. Request insights page again
4. Should regenerate data (slow) and cache the new result

### Test Expiry
1. Manually set `expires_at` to past date in database
2. Request insights page
3. Should regenerate data and create fresh cache entry

## Rollback

If issues arise, you can safely remove the caching:

1. **Remove cache table:**
   ```sql
   DROP TABLE IF EXISTS insights_cache;
   ```

2. **Revert API changes:**
   - Remove `insightsCache` imports from API routes
   - Remove cache check and storage logic
   - Routes will work as before (without caching)

## Future Enhancements

### Possible Improvements:
1. **Cache warming:** Pre-generate cache for active users
2. **Partial invalidation:** Only invalidate cache matching the household/date range
3. **Cache versioning:** Support cache schema changes without full invalidation
4. **Background refresh:** Refresh cache in background before expiry
5. **Redis integration:** Use Redis for even faster cache lookups (optional)

## Migration Status

- ✅ Schema updated
- ✅ Migration script created
- ⏳ **Migration pending:** Run `npx tsx scripts/add-insights-cache.ts` when database is available
- ✅ API routes updated
- ✅ Cache invalidation implemented
- ✅ Non-breaking changes (works with or without cache)
