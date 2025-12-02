# Item Analysis Feature - Usage Guide

## Quick Start

### 1. Using from Receipt Details

The easiest way to use this feature:

1. Open any receipt by clicking on it in your receipts list
2. Scroll to the "Items" section
3. Hover over any line item
4. Click the "Analyze Spending" button that appears
5. View your spending analysis for that item

### 2. Using the Search Component

Add the search component to any page:

```tsx
import { ItemSearchAnalysis } from "@/components/item-search-analysis";

export default function MyPage() {
  return (
    <div>
      <ItemSearchAnalysis />
    </div>
  );
}
```

For household-specific analysis:

```tsx
<ItemSearchAnalysis householdId={currentHouseholdId} />
```

### 3. Programmatic Usage

Use the hook directly in your components:

```tsx
import { useItemAnalysis } from "@/hooks/use-item-analysis";

function MyComponent() {
  const { analysis, isLoading, analyzeItem } = useItemAnalysis();

  const handleAnalyze = async () => {
    const result = await analyzeItem("Coffee", {
      months: 6,
      householdId: "optional-id"
    });
    console.log(result);
  };

  return (
    <button onClick={handleAnalyze}>
      Analyze Coffee Spending
    </button>
  );
}
```

## API Usage

### Direct API Call

Item analysis now uses the top items endpoint internally:

```typescript
// The hook handles this automatically
const { analyzeItem } = useItemAnalysis();
await analyzeItem("Coke", { months: 12 });
```

## Example Scenarios

### Scenario 1: Track Coffee Spending

```tsx
// User clicks on "Latte" in a receipt
<ItemAnalysisDialog
  itemName="Latte"
  open={true}
  onOpenChange={setOpen}
/>

// Results show:
// - Total: $156.00 over 12 months
// - 52 purchases (weekly average)
// - Top merchant: Starbucks (30 purchases)
// - Monthly trend showing increased spending in winter
```

### Scenario 2: Compare Grocery Items

```tsx
// Search for "Milk"
<ItemSearchAnalysis />

// Results show:
// - Total: $48.00 over 12 months
// - 24 purchases (bi-weekly)
// - Tesco: $1.80/purchase
// - Sainsbury's: $2.20/purchase
// - Insight: Save by shopping at Tesco
```

### Scenario 3: Household Budget Analysis

```tsx
// Analyze household spending on shared items
<ItemAnalysisDialog
  itemName="Bread"
  householdId="family-household"
  open={true}
  onOpenChange={setOpen}
/>

// Results show combined household spending
```

## Understanding the Results

### Summary Section
- **Total Purchases**: Number of times you bought this item
- **Total Spent**: Total amount spent on this item
- **Total Quantity**: Total number of items purchased
- **Average Price**: Average cost per purchase
- **Average Quantity**: Average quantity per purchase

### Top Merchants
Shows where you buy this item most frequently, sorted by total spending. Useful for:
- Finding the cheapest option
- Understanding shopping patterns
- Identifying loyalty opportunities

### Monthly Trend
Visual representation of spending over time. Look for:
- Seasonal patterns (e.g., ice cream in summer)
- Increasing/decreasing trends
- Unusual spikes or drops

### Recent Purchases
Last 20 purchases with:
- Date of purchase
- Merchant name
- Quantity purchased
- Price paid
- Link to original receipt

## Tips & Best Practices

### 1. Search Tips
- Use partial names: "Coke" will match "Coca-Cola", "Diet Coke", etc.
- Search is case-insensitive
- Try brand names or generic terms
- Use singular form: "Apple" instead of "Apples"

### 2. Time Periods
- Default is 12 months (1 year)
- Adjust for seasonal items (e.g., 6 months for summer items)
- Use longer periods for infrequent purchases

### 3. Household Analysis
- Include householdId to see shared spending
- Useful for family budgets
- Compare personal vs. household spending

### 4. Interpreting Results
- Low purchase count + high total = expensive item
- High purchase count + low average = frequent small purchases
- Check monthly trend for budget planning
- Use merchant breakdown to optimize shopping

## Common Use Cases

### Budget Planning
```
Search: "Coffee"
Goal: Reduce monthly coffee spending
Action: Identify expensive merchants, set budget based on average
```

### Price Comparison
```
Search: "Milk"
Goal: Find cheapest option
Action: Compare average prices across merchants
```

### Habit Tracking
```
Search: "Snacks"
Goal: Reduce impulse purchases
Action: Review monthly trend, identify patterns
```

### Household Management
```
Search: "Cleaning Supplies"
Goal: Track shared expenses
Action: Use household filter, review total spending
```

## Troubleshooting

### No Results Found
- Check spelling
- Try more generic terms
- Verify you have receipts in the time period
- Ensure receipts have been processed

### Unexpected Results
- Item names may vary across receipts
- OCR may have captured names differently
- Try alternative search terms

### Performance Issues
- Reduce time period (use fewer months)
- Clear browser cache
- Check internet connection

## Integration Examples

### Add to Dashboard

```tsx
// app/dashboard/page.tsx
import { ItemSearchAnalysis } from "@/components/item-search-analysis";

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <QuickStats />
      <ItemSearchAnalysis />
      <RecentReceipts />
    </div>
  );
}
```

### Add to Settings Page

```tsx
// app/settings/page.tsx
export default function Settings() {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="analysis">Spending Analysis</TabsTrigger>
      </TabsList>
      <TabsContent value="analysis">
        <ItemSearchAnalysis />
      </TabsContent>
    </Tabs>
  );
}
```

## Next Steps

1. Try analyzing your most frequent purchases
2. Set spending goals based on the insights
3. Compare prices across merchants
4. Share insights with household members
5. Use trends to plan future budgets
