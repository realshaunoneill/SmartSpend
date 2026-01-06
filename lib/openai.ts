import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { z } from 'zod';

// Zod schemas for type-safe AI responses
const itemModifierSchema = z.object({
  name: z.string(),
  price: z.number(),
  type: z.enum(['fee', 'deposit', 'discount', 'addon', 'modifier']),
});

const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  price: z.number(),
  category: z.string().optional(),
  description: z.string().optional(),
  modifiers: z.array(itemModifierSchema).optional(),
});

const receiptDataSchema = z.object({
  merchant: z.string().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  items: z.array(receiptItemSchema).optional(),
  rawItems: z.array(z.object({
    name: z.string(),
    price: z.number(),
  })).optional(),
  location: z.string().optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  serviceCharge: z.number().optional(),
  paymentMethod: z.string().optional(),
  receiptNumber: z.string().optional(),
  merchantType: z.string().optional(),
  tips: z.number().optional(),
  discount: z.number().optional(),
  loyaltyNumber: z.string().optional(),
  tableNumber: z.string().optional(),
  serverName: z.string().optional(),
  orderNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  website: z.string().optional(),
  vatNumber: z.string().optional(),
  timeOfDay: z.string().optional(),
  customerCount: z.number().optional(),
  specialOffers: z.string().optional(),
  deliveryFee: z.number().optional(),
  packagingFee: z.number().optional(),
});

export type ItemModifier = z.infer<typeof itemModifierSchema>;
export type ReceiptData = z.infer<typeof receiptDataSchema>;

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ReceiptAnalysisResult {
  data: ReceiptData;
  usage: TokenUsage;
}

export interface SpendingInsight {
  summary: string;
  usage: TokenUsage;
}

/**
 * Analyze receipt image using GPT-4o-mini (for /api/receipt/process)
 * This is the main receipt processing function with full extraction
 * Using GPT-4o-mini for cost efficiency - structured data extraction works well with smaller models
 */
export async function analyzeReceiptWithGPT4o(
  imageUrl: string,
  userEmail: string,
  userId: string,
  correlationId: CorrelationId,
): Promise<ReceiptAnalysisResult> {
  submitLogEvent('receipt-process', 'Fetching image for analysis', correlationId, { imageUrl, userId });

  const inputImageRes = await fetch(imageUrl);
  if (!inputImageRes.ok) {
    throw new Error(`Failed to download image: ${inputImageRes.statusText}`);
  }

  const contentType = inputImageRes.headers.get('content-type');
  const inputImageBuffer = await inputImageRes.arrayBuffer();

  const buffer = Buffer.from(inputImageBuffer);
  const base64Image = buffer.toString('base64');
  const mimeType = contentType || 'image/png';

  submitLogEvent('receipt-process', 'Calling OpenAI Vision API with GPT-4o', correlationId, { userId, userEmail });

  // Use GPT-4o for receipt analysis - best accuracy for OCR tasks
  // especially important for faded, crumpled, or hard-to-read receipts
  let result;
  try {
    result = await generateObject({
      model: openai('gpt-4o'),
      schema: receiptDataSchema,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'analyzeReceiptWithGPT4o',
        metadata: {
          userId,
          userEmail,
          correlationId,
          purpose: 'receipt_processing',
        },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this receipt image and extract the following information:

REQUIRED FIELDS:
- merchant: merchant/store name
- total: total amount (number)
- currency: currency code (e.g., "GBP", "USD", "EUR")
- date: transaction date (format as YYYY-MM-DD, use current date if not visible)
- category: spending category based on merchant and items (choose from: "groceries", "dining", "transportation", "shopping", "entertainment", "healthcare", "utilities", "travel", "gas", "coffee", "pharmacy", "clothing", "electronics", "home", "other")

DETAILED EXTRACTION:
- items: array of objects with:
  * name: item name
  * quantity: quantity (number, default 1)
  * price: TOTAL price for this line item (number)
  * category: item category (optional)
  * description: brief description (optional)
  * modifiers: array of sub-items/modifiers (optional), each with:
    - name: modifier name (e.g., "Deposit", "Extra Cheese", "Discount")
    - price: modifier price (number, can be negative for discounts)
    - type: "fee" | "deposit" | "discount" | "addon" | "modifier"
  
  IMPORTANT: Handle indented sub-items correctly:
  - Deposit fees (e.g., "Deposit 15¢" under a beverage item)
  - Item-specific discounts (e.g., "-$2.00 Sale" under an item)
  - Modifiers/add-ons (e.g., "Extra Cheese $1.50" under a sandwich)
  - The main item price should be the final price INCLUDING all modifiers
  - List modifiers separately in the modifiers array for transparency

- location: store location/address (full address if visible)
- subtotal: subtotal amount before tax and service charges (number, if visible)
- tax: tax amount (number, if visible)
- serviceCharge: service charge/fees amount (number, if visible)
- paymentMethod: payment method used (e.g., "Card", "Cash", "Contactless", "Chip & PIN", "Apple Pay", "Google Pay", "Debit", "Credit")
- receiptNumber: receipt or transaction number
- merchantType: type of business (e.g., "restaurant", "grocery_store", "gas_station", "pharmacy", "retail", "coffee_shop", "fast_food", "department_store", "convenience_store", "supermarket", "other")

ADDITIONAL DETAILS:
- tips: tip amount (number, if visible)
- discount: discount amount (number, if visible)
- loyaltyNumber: loyalty card or member number
- tableNumber: table number for restaurants
- serverName: server or cashier name
- orderNumber: order number (different from receipt number)
- phoneNumber: merchant phone number
- website: merchant website
- vatNumber: VAT registration number
- timeOfDay: time of transaction (HH:MM format)
- customerCount: number of customers/covers (for restaurants)
- specialOffers: any special offers or promotions mentioned
- deliveryFee: delivery fee (if applicable)
- packagingFee: packaging fee (if applicable)

SMART CATEGORIZATION RULES:
- "groceries": Supermarkets, food stores, grocery chains
- "dining": Restaurants, cafes, bars, pubs (not coffee shops)
- "coffee": Coffee shops, cafes focused on coffee/beverages
- "gas": Gas stations, fuel, automotive
- "transportation": Parking, transit, taxi, uber, public transport
- "shopping": Retail stores, clothing, electronics, general merchandise
- "pharmacy": Pharmacies, drugstores, medical supplies
- "healthcare": Hospitals, clinics, medical services
- "entertainment": Movies, games, events, recreation
- "utilities": Bills, services, subscriptions
- "travel": Hotels, flights, travel services
- "home": Home improvement, furniture, household items

Extract all numeric values as numbers (not strings).`,
          },
          {
            type: 'image',
            image: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      },
    ],
  });
  } catch (error) {
    // Log detailed debug info for schema validation failures
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails: Record<string, unknown> = {
      userId,
      userEmail,
      imageUrl,
      mimeType,
      imageSize: buffer.length,
      errorMessage,
    };

    // Check if this is a NoObjectGeneratedError from the AI SDK
    if (error && typeof error === 'object' && 'text' in error) {
      // The raw text response that failed to parse
      errorDetails.rawResponse = (error as { text?: string }).text;
    }
    
    // Include the cause if present (often contains validation details)
    if (error instanceof Error && error.cause) {
      errorDetails.errorCause = error.cause;
    }

    // Include the full error object for debugging
    if (error && typeof error === 'object') {
      errorDetails.errorName = (error as Error).name;
      errorDetails.errorStack = (error as Error).stack;
      // Check for Zod validation errors
      if ('issues' in error) {
        errorDetails.zodIssues = (error as { issues: unknown }).issues;
      }
    }

    submitLogEvent('receipt-error', `OpenAI schema validation failed: ${errorMessage}`, correlationId, errorDetails, true);
    
    throw error;
  }

  submitLogEvent('receipt-process', 'OpenAI API usage', correlationId, {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    model: 'gpt-4o-mini',
    userEmail,
    userId,
  });

  return {
    data: result.object,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}


/**
 * Generate spending summary using GPT-4o Mini
 */
export async function generateSpendingSummary(
  aggregatedData: {
    period: string;
    totalItems: number;
    totalSpent: string;
    currency: string;
    topItems: Array<{ name: string; count: number }>;
    topCategories: Array<{ category: string; total: number }>;
    topMerchants: Array<{ merchant: string; total: number }>;
  },
  userEmail: string,
  userId: string,
  correlationId: CorrelationId,
): Promise<SpendingInsight> {
  submitLogEvent('receipt', 'Generating AI spending summary with Vercel AI SDK', correlationId, {
    userId,
    userEmail,
    totalItems: aggregatedData.totalItems,
    totalSpent: aggregatedData.totalSpent,
  });

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful financial advisor analyzing spending patterns. Provide insights, identify trends, and offer actionable advice. Be concise but insightful. Use a friendly, conversational tone.',
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateSpendingSummary',
      metadata: {
        userId,
        userEmail,
        correlationId,
        purpose: 'spending_summary',
        totalItems: aggregatedData.totalItems,
        totalSpent: aggregatedData.totalSpent,
      },
    },
    prompt: `Analyze this spending data and provide a summary with insights and recommendations:

Period: ${aggregatedData.period}
Total Items Purchased: ${aggregatedData.totalItems}
Total Spent: ${aggregatedData.currency} ${aggregatedData.totalSpent}

Top 10 Most Frequently Purchased Items:
${aggregatedData.topItems.map((item, i) => `${i + 1}. ${item.name} (${item.count} times)`).join('\n')}

Top 5 Spending Categories:
${aggregatedData.topCategories.map((cat, i) => `${i + 1}. ${cat.category}: ${aggregatedData.currency} ${cat.total}`).join('\n')}

Top 5 Merchants:
${aggregatedData.topMerchants.map((m, i) => `${i + 1}. ${m.merchant}: ${aggregatedData.currency} ${m.total}`).join('\n')}

Please provide:
1. A brief overview of spending patterns
2. Key insights about purchasing habits
3. Potential areas for savings
4. Any notable trends or patterns
5. 2-3 actionable recommendations

Keep the response under 300 words and format it in a friendly, easy-to-read way.`,
    maxTokens: 500,
    temperature: 0.7,
  });

  submitLogEvent('receipt', 'AI spending summary generated', correlationId, {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    model: 'gpt-4o-mini',
    userEmail,
    userId,
  });

  return {
    summary: result.text.trim(),
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}


