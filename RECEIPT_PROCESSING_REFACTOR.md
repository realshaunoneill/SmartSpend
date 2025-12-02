# Receipt Processing Refactor: Separated AI Models

## Overview
Successfully refactored the receipt processing system to use separate AI models for different tasks:
- **GPT-4.1** (gpt-4-turbo) for image processing and OCR
- **GPT-4o** for line item enhancement and categorization

## Changes Made

### 1. New Functions in `lib/openai.ts`

#### `processReceiptImage()`
- Uses GPT-4.1 for image analysis
- Extracts basic receipt data and raw line items
- Optimized for visual recognition tasks
- Returns `rawItems` array for further processing

#### `processLineItems()`
- Uses GPT-4o for text processing
- Enhances raw items with detailed categorization
- Adds quantity, category, and descriptions
- Optimized for natural language understanding

#### Updated `analyzeReceiptImage()` (Legacy)
- Now combines both functions for backward compatibility
- Maintains existing API contract
- Uses separated processing internally

### 2. Updated Receipt Processing Route

Modified `app/api/receipt/process/route.ts` to:
- Use the new separated functions
- Combine token usage from both models
- Maintain existing response format
- Improved error handling and logging

### 3. Enhanced Data Structure

Added `rawItems` field to `ReceiptData` interface:
```typescript
rawItems?: Array<{
  name: string;
  price: number;
}>;
```

## Benefits

### Performance Optimization
- **GPT-4.1**: Specialized for image analysis and OCR
- **GPT-4o**: Faster and more cost-effective for text processing
- Better accuracy for each specific task

### Enhanced Item Processing
- More detailed item categorization
- Better quantity detection
- Improved descriptions
- Specific categories (produce, dairy, bakery, etc.)

### Flexibility
- Can process images and items independently
- Easy to modify prompts for each model
- Better error isolation
- Scalable architecture

### Cost Efficiency
- GPT-4.1 only used for image processing
- GPT-4o used for less expensive text operations
- Optimized token usage

## Usage Examples

### Direct Usage (New Approach)
```typescript
// Process image with GPT-4.1
const imageResult = await processReceiptImage(imageUrl, email, userId);

// Enhance items with GPT-4o
const itemsResult = await processLineItems(
  imageResult.data.rawItems,
  imageResult.data.merchantType,
  imageResult.data.category,
  email,
  userId
);
```

### Legacy Usage (Backward Compatible)
```typescript
// Still works as before
const result = await analyzeReceiptImage(imageUrl, email, userId);
```

## Testing

Created `scripts/test-separated-processing.ts` to verify:
- ✅ GPT-4.1 image processing simulation
- ✅ GPT-4o line item enhancement simulation
- ✅ Combined token usage calculation
- ✅ Enhanced item categorization

## Token Usage Tracking

Both functions provide detailed usage metrics:
```typescript
{
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

Combined usage is calculated and logged for cost analysis.

## Backward Compatibility

- ✅ Existing API endpoints unchanged
- ✅ Response format maintained
- ✅ All existing functionality preserved
- ✅ Legacy function available for gradual migration

## Next Steps

1. **Monitor Performance**: Track accuracy improvements and cost savings
2. **Fine-tune Prompts**: Optimize prompts for each model based on results
3. **Add Caching**: Consider caching image processing results
4. **Batch Processing**: Implement batch line item processing for efficiency
5. **A/B Testing**: Compare results between old and new approaches

## Configuration

Models used:
- **Image Processing**: `gpt-4-turbo` (GPT-4.1)
- **Line Item Processing**: `gpt-4o`
- **Spending Insights**: `gpt-4o` (unchanged)

All functions include comprehensive logging and error handling for production use.