# React Query Migration

## Overview

All data-fetching hooks have been migrated from manual state management to React Query (@tanstack/react-query) for better caching, automatic refetching, and improved performance.

## Migrated Hooks

### 1. `useTopItems`

**Before:**
```typescript
const { data, isLoading, error, fetchTopItems, reset } = useTopItems();
await fetchTopItems({ householdId, months: 12, sortBy: "frequency" });
```

**After:**
```typescript
const { data, isLoading, error, refetch } = useTopItems({
  householdId,
  months: 12,
  sortBy: "frequency",
  limit: 20,
  enabled: true,
});
```

**Benefits:**
- Automatic caching (5 minutes)
- No manual state management
- Automatic refetching on parameter changes
- Built-in loading and error states

### 2. `useSpendingSummary`

**Before:**
```typescript
const { summary, isLoading, error, fetchSummary, reset } = useSpendingSummary();
await fetchSummary({ householdId, months: 3 });
```

**After:**
```typescript
const { data: summary, isLoading, error, refetch } = useSpendingSummary({
  householdId,
  months: 3,
  enabled: true,
});
```

**Benefits:**
- Longer cache time (10 minutes) since AI responses are expensive
- Automatic deduplication of requests
- No redundant API calls

### 3. `useItemAnalysis`

**Before:**
```typescript
const { analysis, isLoading, error, analyzeItem, reset } = useItemAnalysis();
await analyzeItem("Coke", { householdId, months: 12 });
```

**After:**
```typescript
const { data: analysis, isLoading, error, refetch } = useItemAnalysis({
  itemName: "Coke",
  householdId,
  months: 12,
  enabled: true,
});
```

**Benefits:**
- Caches results per item name
- Prevents duplicate analyses
- Automatic cleanup of old data

## Key Features

### 1. Automatic Caching

**Cache Times:**
- `useTopItems`: 5 minutes stale time, 10 minutes garbage collection
- `useSpendingSummary`: 10 minutes stale time, 30 minutes garbage collection
- `useItemAnalysis`: 5 minutes stale time, 10 minutes garbage collection

**What this means:**
- Data is considered "fresh" for the stale time
- No refetch happens if data is fresh
- Data is kept in memory for garbage collection time
- Reduces API calls significantly

### 2. Automatic Refetching

React Query automatically refetches data when:
- Window regains focus
- Network reconnects
- Query parameters change
- Manual refetch is triggered

### 3. Request Deduplication

If multiple components request the same data simultaneously, React Query makes only one API call and shares the result.

### 4. Optimistic Updates

Easy to implement optimistic updates for better UX (can be added later).

### 5. Background Refetching

Data can be refetched in the background while showing stale data, providing instant UI updates.

## Component Updates

### TopItemsList

**Changes:**
- Removed `useEffect` for initial fetch
- Removed manual `fetchTopItems` calls
- Query automatically refetches when `months` or `sortBy` changes
- Uses `refetch()` for manual refresh

### SpendingSummaryCard

**Changes:**
- Removed `useEffect` for initial fetch
- Removed manual `fetchSummary` calls
- Query automatically refetches when `months` changes
- Uses `refetch()` for manual refresh

### ItemAnalysisDialog

**Changes:**
- Query enabled only when dialog is open
- Automatically fetches when `itemName` or `months` changes
- Uses `refetch()` for manual refresh
- No need for manual state management

## Performance Improvements

### Before Migration

**Issues:**
- Every component mount triggered a new API call
- No caching between components
- Manual state management overhead
- Duplicate requests possible
- No automatic cleanup

**Example:**
```
User opens Insights page
→ TopItemsList fetches data
→ User navigates away
→ User returns to Insights
→ TopItemsList fetches data AGAIN (unnecessary)
```

### After Migration

**Benefits:**
- First mount fetches data
- Subsequent mounts use cached data (if fresh)
- Shared cache between components
- Automatic cleanup of old data
- Request deduplication

**Example:**
```
User opens Insights page
→ TopItemsList fetches data (cached for 5 min)
→ User navigates away
→ User returns to Insights within 5 min
→ TopItemsList shows cached data INSTANTLY
```

## Cache Invalidation

To manually invalidate cache when needed:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ["topItems"] });

// Invalidate all queries
queryClient.invalidateQueries();

// Refetch specific query
queryClient.refetchQueries({ queryKey: ["topItems"] });
```

**Use cases:**
- After uploading a new receipt
- After deleting a receipt
- After updating receipt data

## Error Handling

React Query provides built-in error handling:

```typescript
const { data, error, isError } = useTopItems({ ... });

if (isError) {
  // error is typed as Error
  console.error(error.message);
}
```

**Error states:**
- `error`: The error object
- `isError`: Boolean indicating error state
- `failureCount`: Number of failed attempts
- `failureReason`: Reason for failure

## Loading States

React Query provides granular loading states:

```typescript
const { isLoading, isFetching, isRefetching } = useTopItems({ ... });

// isLoading: true on first fetch only
// isFetching: true on any fetch (including background)
// isRefetching: true on manual refetch
```

## Best Practices

### 1. Use Enabled Flag

Control when queries run:

```typescript
const { data } = useTopItems({
  months: 12,
  enabled: isDialogOpen, // Only fetch when dialog is open
});
```

### 2. Set Appropriate Stale Times

- Frequently changing data: 1-2 minutes
- Moderately changing data: 5-10 minutes
- Rarely changing data: 30-60 minutes
- Expensive operations (AI): 10-30 minutes

### 3. Use Query Keys Wisely

Query keys should include all parameters that affect the data:

```typescript
queryKey: ["topItems", { householdId, months, sortBy }]
```

This ensures different parameter combinations are cached separately.

### 4. Leverage Background Refetching

```typescript
const { data } = useTopItems({
  months: 12,
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchOnReconnect: true, // Refetch when internet reconnects
});
```

## Future Enhancements

### 1. Mutations

Add mutations for data updates:

```typescript
const mutation = useMutation({
  mutationFn: (newReceipt) => uploadReceipt(newReceipt),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["topItems"] });
  },
});
```

### 2. Infinite Queries

For paginated data:

```typescript
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ["receipts"],
  queryFn: ({ pageParam = 1 }) => fetchReceipts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### 3. Optimistic Updates

Update UI before server responds:

```typescript
const mutation = useMutation({
  mutationFn: updateReceipt,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["receipts"] });
    const previous = queryClient.getQueryData(["receipts"]);
    queryClient.setQueryData(["receipts"], (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(["receipts"], context.previous);
  },
});
```

### 4. Prefetching

Prefetch data before it's needed:

```typescript
queryClient.prefetchQuery({
  queryKey: ["topItems", { months: 12 }],
  queryFn: () => fetchTopItems({ months: 12 }),
});
```

## Migration Checklist

- [x] Migrate `useTopItems` to React Query
- [x] Migrate `useSpendingSummary` to React Query
- [x] Migrate `useItemAnalysis` to React Query
- [x] Update `TopItemsList` component
- [x] Update `SpendingSummaryCard` component
- [x] Update `ItemAnalysisDialog` component
- [x] Fix error handling in all components
- [x] Test all components
- [ ] Add cache invalidation on receipt upload
- [ ] Add cache invalidation on receipt delete
- [ ] Add prefetching for common queries
- [ ] Add optimistic updates for mutations

## Testing

### Manual Testing

1. **Cache Verification**
   - Open Insights page
   - Note network request
   - Navigate away and back
   - Verify no new request (within stale time)

2. **Parameter Changes**
   - Change time period dropdown
   - Verify new request is made
   - Change back to previous period
   - Verify cached data is used

3. **Error Handling**
   - Disconnect internet
   - Try to fetch data
   - Verify error message displays
   - Reconnect internet
   - Verify automatic refetch

4. **Loading States**
   - Clear cache
   - Open Insights page
   - Verify loading spinner shows
   - Verify data appears after load

## Conclusion

The migration to React Query provides:
- **Better Performance**: Automatic caching and deduplication
- **Better UX**: Instant data display from cache
- **Less Code**: No manual state management
- **More Features**: Built-in refetching, error handling, etc.
- **Lower Costs**: Fewer API calls, especially for AI endpoints

All hooks now follow React Query best practices and provide a solid foundation for future enhancements.
