# Receipt Search and Filters Feature

## Overview
Implemented comprehensive search and filtering functionality for receipts, allowing users to search across both personal and household receipts with multiple filter criteria.

## Implementation Summary

### Backend Changes

#### 1. Database Query Layer (`lib/receipt-scanner.ts`)
- **Extended `GetReceiptsOptions` interface** with search/filter parameters:
  - `search?: string` - Full-text search across merchant and category
  - `category?: string` - Filter by receipt category
  - `merchant?: string` - Filter by merchant name
  - `minAmount?: string` - Minimum transaction amount
  - `maxAmount?: string` - Maximum transaction amount
  - `startDate?: string` - Start date for date range filter
  - `endDate?: string` - End date for date range filter
  - `sortBy?: string` - Sort field (date/amount/merchant)
  - `sortOrder?: string` - Sort direction (asc/desc)

- **Updated `getReceipts()` function** with dynamic filter building:
  - Text search using `ilike` operator for case-insensitive matching
  - Category filtering with exact match
  - Merchant filtering with partial match
  - Amount range filtering using `CAST` to DECIMAL and `gte`/`lte` operators
  - Date range filtering on `transactionDate` field
  - Configurable sorting by date, amount, or merchant name
  - Filters applied consistently across household, personal, and all receipt queries

#### 2. API Route (`app/api/receipts/route.ts`)
- **Already updated** to extract and pass all filter parameters from query string
- Parameters forwarded to `getReceipts()` function
- Maintains backward compatibility with existing queries

### Frontend Changes

#### 1. React Hook (`lib/hooks/use-receipts.ts`)
- **Added `ReceiptFilters` interface** matching backend filter structure
- **Updated `useReceipts()` signature** to accept optional `filters` parameter
- **Modified query key** to include filters for proper cache invalidation
- **Enhanced URLSearchParams** construction to append all filter values
- **Updated `useRecentReceipts()`** to maintain backward compatibility

#### 2. Search UI Component (`components/receipts/receipt-search-filters.tsx`)
- **Quick search bar** with live search functionality
- **Advanced filters sheet** with comprehensive filter options:
  - Category dropdown (Groceries, Restaurant, Retail, etc.)
  - Merchant name input
  - Amount range inputs (min/max)
  - Date range pickers (start/end)
  - Sort options (by date/amount/merchant, asc/desc)
- **Active filter badge** showing count of applied filters
- **Clear all filters** button
- **Apply filters** action with sheet close
- **Responsive design** optimized for mobile and desktop

#### 3. Receipts Page (`app/receipts/page.tsx`)
- **Integrated search component** above receipt list
- **Added filter state management** with useState hook
- **Connected filters to useReceipts** hook with proper parameter passing
- **Automatic page reset** when filters change
- **Filter change handlers** for updating and clearing filters
- **Maintains existing functionality**:
  - Household selector
  - Recent receipts section
  - Pagination
  - Receipt detail modal
  - Batch upload

## Features

### Search Capabilities
- ✅ Full-text search across merchant names and categories
- ✅ Case-insensitive matching
- ✅ Real-time search as you type
- ✅ Searches both personal and household receipts

### Filter Options
- ✅ **Category Filter**: Select from predefined categories
- ✅ **Merchant Filter**: Search by merchant name (partial match)
- ✅ **Amount Range**: Filter by minimum and maximum amount
- ✅ **Date Range**: Filter by transaction date range
- ✅ **Sort Options**: Sort by date, amount, or merchant (ascending/descending)

### User Experience
- ✅ Quick search bar for immediate text search
- ✅ Advanced filters in slide-out sheet
- ✅ Active filter count badge
- ✅ One-click filter clearing
- ✅ Pagination preserved across filter changes
- ✅ Automatic page reset when filters change
- ✅ Responsive design for mobile and desktop

## Technical Details

### SQL Query Optimization
- Uses `ilike` for case-insensitive pattern matching
- Proper SQL type casting for amount comparisons (`CAST(totalAmount AS DECIMAL)`)
- Indexed fields for optimal query performance (transactionDate, merchantName, category)
- Dynamic condition building to avoid unnecessary query complexity

### State Management
- React Query for server state with proper cache invalidation
- Local component state for filter UI
- URL parameters preserve filter state (future enhancement opportunity)
- Debouncing not implemented but can be added for search input

### Security
- All queries respect user and household permissions
- Filters applied at database level (not client-side)
- No raw SQL injection vulnerabilities (uses Drizzle ORM operators)

## Usage Example

```typescript
// Basic usage with filters
const { receipts, pagination, isLoading } = useReceipts(
  householdId,
  page,
  pageSize,
  {
    search: "walmart",
    category: "groceries",
    minAmount: "10.00",
    maxAmount: "100.00",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    sortBy: "amount",
    sortOrder: "desc"
  }
)
```

## Future Enhancements
- [ ] Save favorite filter combinations
- [ ] URL parameter persistence for shareable filtered views
- [ ] Export filtered results to CSV
- [ ] Debounced search input for performance
- [ ] Advanced search operators (AND/OR/NOT)
- [ ] Tag-based filtering
- [ ] Multi-select categories
- [ ] Saved searches

## Files Modified
- `lib/receipt-scanner.ts` - Database query logic
- `app/api/receipts/route.ts` - API endpoint (already done)
- `lib/hooks/use-receipts.ts` - React Query hook
- `components/receipts/receipt-search-filters.tsx` - New component
- `app/receipts/page.tsx` - Page integration

## Testing Checklist
- [ ] Search by merchant name
- [ ] Search by category
- [ ] Filter by single category
- [ ] Filter by amount range
- [ ] Filter by date range
- [ ] Combine multiple filters
- [ ] Sort by date/amount/merchant
- [ ] Clear all filters
- [ ] Test with household receipts
- [ ] Test with personal receipts
- [ ] Test with empty results
- [ ] Test mobile responsiveness
- [ ] Test pagination with filters
