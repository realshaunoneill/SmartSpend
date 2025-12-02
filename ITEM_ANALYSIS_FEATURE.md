# Item Spending Analysis Feature

## Overview

This feature allows users to analyze their spending on specific line items across the previous year. Users can click on any item in a receipt to see detailed spending patterns, trends, and insights.

## Components

### 1. Item Analysis (Using Top Items Endpoint)

**Note:** Item analysis now uses the `/api/receipts/items/top` endpoint with filtering.

**Location:** `hooks/use-item-analysis.ts`

**How it works:**
- Fetches top items from the database
- Filters to find the specific item requested
- Transforms data to provide item-specific insights

**Data Provided:**
- Total purchases and spending
- Average price
- List of merchants where purchased
- Last purchase date
- Total quantity purchased

### 2. React Hook: `useItemAnalysis`

**Location:** `hooks/use-item-analysis.ts`

**Usage:**
```typescript
const { analysis, isLoading, error, analyzeItem, reset } = useItemAnalysis();

// Analyze an item
await analyzeItem("Coke", { 
  householdId: "optional-household-id",
  months: 12 
});
```

### 3. Item Analysis Dialog Component

**Location:** `components/item-analysis-dialog.tsx`

**Features:**
- Summary cards showing total purchases, total spent, and time period
- Top merchants breakdown with counts and totals
- Monthly spending trend with visual bar chart
- Recent purchases list with dates and prices
- Refresh functionality

**Usage:**
```tsx
<ItemAnalysisDialog
  itemName="Coke"
  open={showDialog}
  onOpenChange={setShowDialog}
  householdId="optional-household-id"
/>
```

### 4. Item Search Analysis Component

**Location:** `components/item-search-analysis.tsx`

A standalone search component that can be added to any page.

**Usage:**
```tsx
<ItemSearchAnalysis householdId="optional-household-id" />
```

### 5. Receipt Detail Modal Integration

**Location:** `components/receipt-detail-modal.tsx`

Each line item in the receipt detail modal now has an "Analyze Spending" button that appears on hover. Clicking it opens the Item Analysis Dialog for that specific item.

## How It Works

1. **User Interaction:**
   - User clicks on an item in a receipt OR
   - User searches for an item using the search component

2. **Data Retrieval:**
   - API performs case-insensitive search across all receipt items
   - Filters by user ID and optional household ID
   - Looks back specified number of months (default: 12)

3. **Analysis:**
   - Aggregates total spending and quantity
   - Calculates averages
   - Groups by merchant
   - Groups by month for trend analysis
   - Returns recent purchases

4. **Visualization:**
   - Summary cards show key metrics
   - Merchant breakdown shows where items are purchased
   - Monthly trend shows spending patterns over time
   - Recent purchases provide transaction details

## Database Query

The feature uses the top items endpoint which:
- Aggregates all receipt items
- Groups by item name (case-insensitive)
- Calculates totals and averages
- Filters by date range and optional household

## Use Cases

1. **Budget Tracking:** See how much you spend on specific items like coffee, snacks, or groceries
2. **Price Comparison:** Compare prices across different merchants
3. **Spending Trends:** Identify if spending on an item is increasing or decreasing
4. **Household Analysis:** See household-wide spending on shared items
5. **Shopping Habits:** Understand where and when you buy specific items

## Future Enhancements

Potential improvements:
- Export analysis to CSV/PDF
- Set spending alerts for specific items
- Compare items across categories
- Suggest cheaper alternatives based on merchant data
- Add date range picker for custom periods
- Show price trends over time with line charts
- Add filters for category, merchant, or price range

## Performance Considerations

- Query uses indexed fields (userId, transactionDate)
- Results are limited to prevent excessive data transfer
- Aggregations are performed in-memory after retrieval
- Consider adding pagination for items with many purchases

## Security

- User authentication required via Clerk
- Users can only see their own receipts
- Household filtering respects membership permissions
- All queries are parameterized to prevent SQL injection
