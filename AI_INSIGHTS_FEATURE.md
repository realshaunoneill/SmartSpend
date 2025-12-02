# AI-Powered Spending Insights Feature

## Overview

This feature provides AI-powered analysis of spending patterns using OpenAI to generate personalized insights, recommendations, and summaries. It also includes a "Top Items" view to see the most frequently purchased items.

## Features

### 1. AI Spending Summary (`/api/receipts/items/summary`)

**Purpose:** Analyzes receipt items and generates AI-powered insights about spending patterns.

**How it works:**
1. Fetches all receipt items from the database for the specified period
2. Calculates statistics (total spent, item counts, categories, merchants)
3. Sends aggregated data to OpenAI GPT-4o-mini
4. Returns AI-generated insights with actionable recommendations

**API Endpoint:**
```
GET /api/receipts/items/summary?months=3&householdId=optional
```

**Query Parameters:**
- `months` (optional, default: 3): Number of months to analyze
- `householdId` (optional): Filter by household

**Response:**
```json
{
  "summary": "AI-generated text summary with insights...",
  "data": {
    "period": { "startDate": "2024-09-01", "endDate": "2024-12-01", "months": 3 },
    "statistics": {
      "totalItems": 150,
      "totalSpent": 450.50,
      "currency": "USD",
      "averagePerItem": 3.00
    },
    "topItems": [...],
    "topCategories": [...],
    "topMerchants": [...]
  },
  "usage": {
    "promptTokens": 250,
    "completionTokens": 180,
    "totalTokens": 430
  }
}
```

**AI Prompt Structure:**
- System: Acts as a financial advisor
- User: Provides aggregated spending data
- Requests: Overview, insights, savings opportunities, trends, recommendations

**Token Usage:**
- Model: GPT-4o-mini (cost-effective)
- Average: 400-500 tokens per request
- Max tokens: 500 (keeps responses concise)

### 2. Top Items List (`/api/receipts/items/top`)

**Purpose:** Shows the most frequently purchased or highest spending items.

**How it works:**
1. Fetches all receipt items for the period
2. Groups items by name (case-insensitive)
3. Calculates frequency, total spending, averages
4. Sorts by frequency or spending
5. Returns top N items

**API Endpoint:**
```
GET /api/receipts/items/top?months=12&sortBy=frequency&limit=20
```

**Query Parameters:**
- `months` (optional, default: 12): Number of months to look back
- `limit` (optional, default: 20): Number of items to return
- `sortBy` (optional, default: 'frequency'): Sort by 'frequency' or 'spending'
- `householdId` (optional): Filter by household

**Response:**
```json
{
  "topItems": [
    {
      "name": "Coca-Cola",
      "count": 45,
      "totalSpent": 67.50,
      "totalQuantity": 52.0,
      "averagePrice": 1.50,
      "category": "beverages",
      "merchantCount": 3,
      "merchants": ["Tesco", "Sainsbury's", "Asda"],
      "lastPurchased": "2024-12-01",
      "currency": "USD"
    }
  ],
  "summary": {
    "totalUniqueItems": 250,
    "totalPurchases": 1500,
    "totalSpent": 4500.00,
    "currency": "USD",
    "period": { ... }
  },
  "sortBy": "frequency"
}
```

## Components

### 1. SpendingSummaryCard

**Location:** `components/spending-summary-card.tsx`

**Features:**
- Time period selector (1, 3, 6, 12 months)
- Generate/Refresh button
- Loading state with animation
- Statistics cards (items, total spent, average)
- AI-generated summary text
- Quick stats: top items, categories, merchants
- Token usage display

**Usage:**
```tsx
<SpendingSummaryCard 
  householdId="optional-id"
  autoLoad={true}
/>
```

### 2. TopItemsList

**Location:** `components/top-items-list.tsx`

**Features:**
- Time period selector
- Sort by frequency or spending (tabs)
- Summary statistics
- Clickable items (opens analysis dialog)
- Shows: count, spending, merchants, last purchase
- Category badges
- Responsive design

**Usage:**
```tsx
<TopItemsList 
  householdId="optional-id"
  autoLoad={true}
/>
```

### 3. Insights Page

**Location:** `app/insights/page.tsx`

A dedicated page combining all insight features:
- AI Spending Summary
- Top Items List
- Item Search Analysis

**Access:** Navigate to `/insights` or click "Insights" in navigation

## React Hooks

### useSpendingSummary

```typescript
const { summary, isLoading, error, fetchSummary, reset } = useSpendingSummary();

await fetchSummary({ householdId: "id", months: 3 });
```

### useTopItems

```typescript
const { data, isLoading, error, fetchTopItems, reset } = useTopItems();

await fetchTopItems({ 
  householdId: "id", 
  months: 12, 
  sortBy: "frequency",
  limit: 20 
});
```

## Database Queries

### Summary Query
- Joins `receipt_items` with `receipts`
- Filters by user, date range, optional household
- Limits to 500 items (prevents token overflow)
- Orders by transaction date (descending)

### Top Items Query
- Same join and filters as summary
- No limit (needs all items for accurate aggregation)
- Groups items by normalized name
- Calculates aggregates in-memory

## Performance Considerations

### API Response Times
- Summary: 2-5 seconds (includes OpenAI call)
- Top Items: <1 second (database only)

### Optimization Strategies
1. **Limit data sent to OpenAI:** Only top 10 items, 5 categories, 5 merchants
2. **Use GPT-4o-mini:** 60% cheaper than GPT-4o, sufficient for this task
3. **Cache results:** Consider caching summaries for 1 hour
4. **Batch processing:** Could generate summaries overnight for all users
5. **Index optimization:** Ensure `transactionDate` and `userId` are indexed

### Cost Analysis
- GPT-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average request: 250 input + 180 output tokens
- Cost per summary: ~$0.0001 (essentially free)
- 10,000 summaries/month: ~$1.00

## Security & Privacy

### Authentication
- All endpoints require Clerk authentication
- User can only see their own data
- Household filtering respects membership

### Data Sent to OpenAI
- **Included:** Aggregated statistics, item names, categories, merchants
- **Excluded:** User email, user ID, receipt images, exact dates
- **Anonymized:** No personally identifiable information

### OpenAI Configuration
- User metadata included for tracking
- No data retention by OpenAI (per API terms)
- Responses not used for training

## Use Cases

### 1. Budget Planning
User wants to understand spending patterns to create a budget.
- View AI summary for insights
- Check top items to identify major expenses
- Use recommendations to set spending limits

### 2. Cost Reduction
User wants to reduce spending.
- AI identifies high-spending categories
- Top items shows where money goes
- Recommendations suggest alternatives

### 3. Habit Tracking
User wants to track consumption habits.
- Top items by frequency shows habits
- Monthly trends reveal patterns
- AI provides behavioral insights

### 4. Household Management
Family wants to understand shared spending.
- Filter by household ID
- See combined top items
- AI analyzes family spending patterns

## Future Enhancements

### Short-term
1. **Caching:** Cache AI summaries for 1 hour to reduce API calls
2. **Export:** Allow exporting insights to PDF
3. **Scheduling:** Generate weekly/monthly email summaries
4. **Comparisons:** Compare current period to previous period

### Medium-term
1. **Goals:** Set spending goals and track progress
2. **Alerts:** Notify when spending exceeds thresholds
3. **Predictions:** Predict future spending based on trends
4. **Recommendations:** Suggest specific products/merchants for savings

### Long-term
1. **Custom AI Models:** Fine-tune model on user's spending patterns
2. **Voice Interface:** Ask questions about spending via voice
3. **Integration:** Connect with budgeting apps
4. **Social Features:** Compare anonymized spending with similar users

## Testing

### Manual Testing Checklist

**AI Summary:**
- [ ] Generates summary with valid data
- [ ] Handles empty data gracefully
- [ ] Respects time period parameter
- [ ] Filters by household correctly
- [ ] Shows loading state
- [ ] Displays error messages
- [ ] Token usage displayed
- [ ] Refresh works correctly

**Top Items:**
- [ ] Loads items successfully
- [ ] Sorts by frequency correctly
- [ ] Sorts by spending correctly
- [ ] Groups similar items (case-insensitive)
- [ ] Shows accurate counts and totals
- [ ] Clicking item opens analysis
- [ ] Time period selector works
- [ ] Summary stats accurate

**Integration:**
- [ ] Navigation link works
- [ ] Page loads without errors
- [ ] All components render
- [ ] Auto-load works
- [ ] Responsive on mobile
- [ ] Dark mode compatible

### Performance Testing
- [ ] Summary generates in <5 seconds
- [ ] Top items loads in <1 second
- [ ] Page handles 500+ items
- [ ] No memory leaks
- [ ] Smooth scrolling

## Troubleshooting

### AI Summary Not Generating
- Check OpenAI API key is set
- Verify user has receipts in period
- Check API rate limits
- Review error logs

### Top Items Empty
- Verify receipts exist in database
- Check date range
- Ensure items are linked to receipts
- Review household filter

### Slow Performance
- Reduce time period
- Check database indexes
- Review query execution plan
- Consider caching

## Monitoring

### Key Metrics
- AI summary generation time
- OpenAI token usage
- API error rates
- User engagement (views, refreshes)
- Cost per user

### Logging
All operations logged with `submitLogEvent`:
- `receipt`: Summary/top items operations
- `receipt-error`: Failures
- Includes: userId, itemCount, totalSpent, tokensUsed

## Documentation Files
- `AI_INSIGHTS_FEATURE.md` (this file): Technical documentation
- `ITEM_ANALYSIS_FEATURE.md`: Item-specific analysis
- `ITEM_ANALYSIS_USAGE.md`: User guide
