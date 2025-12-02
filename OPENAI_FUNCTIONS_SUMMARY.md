# OpenAI Functions Summary

Quick reference for all centralized OpenAI functions in `lib/openai.ts`.

## Functions

### 1. `analyzeReceiptWithGPT4o(imageUrl, userEmail, userId)`
**Purpose**: Full receipt processing with comprehensive extraction  
**Model**: GPT-4o  
**Used by**: `/api/receipt/process`  
**Returns**: `{ data: ReceiptData, usage: TokenUsage }`

**Extracts**:
- Core: merchant, total, currency, date, category
- Items: name, quantity, price, category, description
- Business: location, type, phone, website, VAT
- Transaction: payment method, receipt #, order #, time
- Financial: subtotal, tax, tips, fees, discounts
- Service: table #, server, customer count
- Loyalty: loyalty #, special offers

---

### 2. `analyzeReceiptSimple(imageUrl)`
**Purpose**: Basic receipt extraction for upload workflow  
**Model**: GPT-4o  
**Used by**: `/api/receipt/upload`  
**Returns**: `ReceiptData` (basic fields only)

**Extracts**:
- Items, merchant, date, total, currency
- Location, subtotal, tax, service charge
- Payment method, receipt number

---

### 3. `generateSpendingSummary(aggregatedData, userEmail, userId)`
**Purpose**: AI-powered spending insights and recommendations  
**Model**: GPT-4o Mini (cost-efficient)  
**Used by**: `/api/receipts/items/summary`  
**Returns**: `{ summary: string, usage: TokenUsage }`

**Input Data**:
```typescript
{
  period: string;           // e.g., "3 months"
  totalItems: number;
  totalSpent: string;
  currency: string;
  topItems: Array<{ name, count }>;
  topCategories: Array<{ category, total }>;
  topMerchants: Array<{ merchant, total }>;
}
```

**Provides**:
- Overview of spending patterns
- Key insights about habits
- Potential savings opportunities
- Notable trends
- 2-3 actionable recommendations

---

### 4. `cleanJsonResponse(content)`
**Purpose**: Parse and clean JSON from AI responses  
**Returns**: Parsed JSON object

**Handles**:
- Markdown code blocks (```json)
- Plain code blocks (```)
- Raw JSON strings

---

## Quick Usage

```typescript
// Receipt processing
import { analyzeReceiptWithGPT4o } from "@/lib/openai";
const { data, usage } = await analyzeReceiptWithGPT4o(url, email, userId);

// Simple analysis
import { analyzeReceiptSimple } from "@/lib/openai";
const data = await analyzeReceiptSimple(url);

// Spending summary
import { generateSpendingSummary } from "@/lib/openai";
const { summary, usage } = await generateSpendingSummary(data, email, userId);
```

## Token Usage

All functions return token usage:
```typescript
{
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

## Logging

All functions automatically log:
- Request initiation
- Token usage
- Model used
- User tracking
- Errors

## Error Handling

All functions include:
- Network error handling
- API error handling
- JSON parsing error handling
- Comprehensive error logging
