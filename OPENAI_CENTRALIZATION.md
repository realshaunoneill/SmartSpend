# OpenAI Logic Centralization

## Overview
Successfully centralized all OpenAI logic from API routes into `lib/openai.ts` for better maintainability and consistency:
- **GPT-4o** for receipt image processing with full extraction
- **GPT-4o** for simple receipt analysis (upload route)
- **GPT-4o Mini** for spending summaries (cost-efficient)
- **All OpenAI functions** centralized in `lib/openai.ts`

## Changes Made

### 1. Centralized Functions in `lib/openai.ts`

#### `analyzeReceiptWithGPT4o()`
- Main receipt processing function with full extraction
- Uses GPT-4o for comprehensive image analysis
- Extracts 25+ fields including items, merchant details, financial breakdown
- Used by `/api/receipt/process` route
- Returns structured data with token usage

**Features:**
- Smart categorization (groceries, dining, coffee, gas, etc.)
- Detailed item extraction with categories and descriptions
- Business information (type, location, contact details)
- Financial breakdown (subtotal, tax, tips, fees, discounts)
- Service details (table number, server name, customer count)
- Loyalty and promotions tracking

#### `analyzeReceiptSimple()`
- Simple receipt analysis for upload workflow
- Uses GPT-4o for basic extraction
- Extracts core fields: items, merchant, total, date, etc.
- Used by `/api/receipt/upload` route
- Lightweight and fast

#### `generateSpendingSummary()`
- Uses GPT-4o Mini for cost-efficient text analysis
- Generates friendly spending summaries with insights
- Provides actionable recommendations
- Used by `/api/receipts/items/summary` route
- Optimized for conversational responses

**Provides:**
- Overview of spending patterns
- Key insights about purchasing habits
- Potential areas for savings
- Notable trends or patterns
- 2-3 actionable recommendations

#### `cleanJsonResponse()`
- Utility function to parse AI responses
- Removes markdown code blocks
- Handles various JSON formats
- Shared across all functions

### 2. Updated API Routes

#### `app/api/receipt/process/route.ts`
**Before:**
- Had local `analyzeReceipt()` function with 150+ lines of OpenAI logic
- Direct OpenAI client instantiation
- Inline prompt management

**After:**
- Imports `analyzeReceiptWithGPT4o()` from lib
- Single function call: `await analyzeReceiptWithGPT4o(imageUrl, email, user.id)`
- Cleaner, more maintainable code
- Removed ~150 lines of OpenAI-specific code

#### `app/api/receipts/items/summary/route.ts`
**Before:**
- Inline OpenAI chat completion logic
- Direct prompt construction in route
- Manual token usage tracking

**After:**
- Imports `generateSpendingSummary()` from lib
- Single function call with aggregated data
- Automatic token usage tracking
- Removed ~50 lines of OpenAI-specific code

#### `app/api/receipt/upload/route.ts`
**Before:**
- Local `analyzeReceipt()` function
- Duplicate image processing logic
- Direct OpenAI client usage

**After:**
- Imports `analyzeReceiptSimple()` from lib
- Reuses centralized logic
- Consistent error handling
- Removed ~80 lines of duplicate code

### 3. Benefits of Centralization

#### Maintainability
- ✅ Single source of truth for OpenAI logic
- ✅ Easy to update prompts across all routes
- ✅ Consistent error handling and logging
- ✅ Reduced code duplication (~280 lines removed)

#### Consistency
- ✅ Standardized token usage tracking
- ✅ Uniform response formats
- ✅ Consistent metadata and user tracking
- ✅ Same error handling patterns

#### Testability
- ✅ Functions can be tested independently
- ✅ Easy to mock for unit tests
- ✅ Clear input/output contracts
- ✅ Isolated from route logic

#### Flexibility
- ✅ Easy to add new AI functions
- ✅ Can switch models without changing routes
- ✅ Reusable across different endpoints
- ✅ Simple to add new features

### 4. Data Structures

#### ReceiptData Interface
```typescript
interface ReceiptData {
  // Core fields
  merchant?: string;
  total?: number;
  currency?: string;
  date?: string;
  category?: string;
  
  // Items
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
    category?: string;
    description?: string;
  }>;
  
  // Business details
  location?: string;
  merchantType?: string;
  phoneNumber?: string;
  website?: string;
  vatNumber?: string;
  
  // Transaction details
  paymentMethod?: string;
  receiptNumber?: string;
  orderNumber?: string;
  timeOfDay?: string;
  
  // Financial breakdown
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  tips?: number;
  discount?: number;
  deliveryFee?: number;
  packagingFee?: number;
  
  // Service details
  tableNumber?: string;
  serverName?: string;
  customerCount?: number;
  
  // Loyalty & promotions
  loyaltyNumber?: string;
  specialOffers?: string;
}
```

#### TokenUsage Interface
```typescript
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

#### ReceiptAnalysisResult Interface
```typescript
interface ReceiptAnalysisResult {
  data: ReceiptData;
  usage: TokenUsage;
}
```

## Usage Examples

### Receipt Processing
```typescript
import { analyzeReceiptWithGPT4o } from "@/lib/openai";

const { data, usage } = await analyzeReceiptWithGPT4o(
  imageUrl,
  userEmail,
  userId
);

console.log(`Extracted ${data.items?.length} items`);
console.log(`Used ${usage.totalTokens} tokens`);
```

### Spending Summary
```typescript
import { generateSpendingSummary } from "@/lib/openai";

const { summary, usage } = await generateSpendingSummary(
  {
    period: "3 months",
    totalItems: 150,
    totalSpent: "1234.56",
    currency: "USD",
    topItems: [...],
    topCategories: [...],
    topMerchants: [...]
  },
  userEmail,
  userId
);

console.log(summary); // Friendly AI-generated insights
```

### Simple Receipt Analysis
```typescript
import { analyzeReceiptSimple } from "@/lib/openai";

const data = await analyzeReceiptSimple(imageUrl);

console.log(`Merchant: ${data.merchant}`);
console.log(`Total: ${data.currency} ${data.total}`);
```

## Model Configuration

### Current Models
- **Receipt Processing**: `gpt-4o` (comprehensive extraction)
- **Upload Analysis**: `gpt-4o` (basic extraction)
- **Spending Summaries**: `gpt-4o-mini` (cost-efficient)

### Token Limits
- Receipt Processing: 1000 max tokens
- Spending Summaries: 500 max tokens

### Temperature Settings
- Receipt Processing: Default (0)
- Spending Summaries: 0.7 (more creative)

## Logging & Monitoring

All functions include comprehensive logging:
- Request initiation
- Token usage (prompt, completion, total)
- Model used
- User tracking (email, userId)
- Purpose/context
- Errors and exceptions

Example log events:
```typescript
submitLogEvent('receipt-process', "Calling OpenAI Vision API", null, {
  userId,
  userEmail,
  model: "gpt-4o"
});

submitLogEvent('receipt-process', "OpenAI API usage", null, {
  promptTokens: 150,
  completionTokens: 200,
  totalTokens: 350,
  model: "gpt-4o"
});
```

## Error Handling

All functions include proper error handling:
- Network errors (fetch failures)
- OpenAI API errors
- JSON parsing errors
- Missing response content
- Logged with context for debugging

## Next Steps

1. **Add Caching**: Cache image processing results to reduce costs
2. **Batch Processing**: Process multiple receipts in parallel
3. **A/B Testing**: Compare different prompts and models
4. **Cost Tracking**: Monitor token usage per user/household
5. **Rate Limiting**: Implement rate limits for API calls
6. **Retry Logic**: Add exponential backoff for failed requests
7. **Streaming**: Consider streaming responses for better UX

## Migration Notes

All existing routes have been updated to use the centralized functions. No breaking changes to API contracts or response formats. The refactoring is transparent to API consumers.

### Files Modified
- ✅ `lib/openai.ts` - Created with all centralized functions
- ✅ `app/api/receipt/process/route.ts` - Updated to use `analyzeReceiptWithGPT4o()`
- ✅ `app/api/receipts/items/summary/route.ts` - Updated to use `generateSpendingSummary()`
- ✅ `app/api/receipt/upload/route.ts` - Updated to use `analyzeReceiptSimple()`

### Code Reduction
- **Total lines removed**: ~280 lines of duplicate OpenAI logic
- **Functions centralized**: 3 main functions + 1 utility
- **Routes simplified**: 3 routes now use shared logic
