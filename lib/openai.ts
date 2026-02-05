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
  quantity: z.number().nullable().optional(),
  price: z.number(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  modifiers: z.array(itemModifierSchema).nullable().optional(),
});

const receiptDataSchema = z.object({
  isReceipt: z.boolean().default(true).describe('Whether this image appears to be a receipt, invoice, or purchase-related document. False if it\'s a screenshot, meme, random image, etc.'),
  merchant: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  items: z.array(receiptItemSchema).nullable().optional(),
  rawItems: z.array(z.object({
    name: z.string(),
    price: z.number(),
  })).nullable().optional(),
  location: z.string().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  serviceCharge: z.number().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
  merchantType: z.string().nullable().optional(),
  tips: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  loyaltyNumber: z.string().nullable().optional(),
  tableNumber: z.string().nullable().optional(),
  serverName: z.string().nullable().optional(),
  orderNumber: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  timeOfDay: z.string().nullable().optional(),
  customerCount: z.number().nullable().optional(),
  specialOffers: z.string().nullable().optional(),
  deliveryFee: z.number().nullable().optional(),
  packagingFee: z.number().nullable().optional(),
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

  // Get current date for context
  const currentDate = new Date().toISOString().split('T')[0];

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
              text: `Today's date is ${currentDate}. Analyze this image and extract receipt information.

FIRST: Determine if this is actually a receipt, invoice, or purchase-related document.
- Set isReceipt to TRUE for: receipts, invoices, bills, purchase orders, payment confirmations
- Set isReceipt to FALSE for: screenshots, memes, random photos, documents unrelated to purchases, text messages, social media posts, articles, etc.

If isReceipt is FALSE, you can skip detailed extraction (but still try to identify what the image contains in the merchant field for context).

REQUIRED FIELDS:
- isReceipt: boolean - whether this is actually a receipt/invoice/purchase document
- merchant: merchant/store name (or description of image content if not a receipt)
- total: total amount (number)
- currency: currency code (e.g., "GBP", "USD", "EUR")
- date: transaction date or invoice date (format as YYYY-MM-DD). Look for: "Date", "Due date", "Invoice date", "Transaction date", or any visible date on the document. If no date is visible, use today's date: ${currentDate}
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
    model: 'gpt-4o',
    userEmail,
    userId,
  });

  // Log the full extracted receipt data for debugging
  submitLogEvent('receipt-analysis-result', 'Full receipt analysis data extracted', correlationId, {
    userId,
    userEmail,
    extractedData: result.object,
    itemCount: result.object.items?.length || 0,
    rawItemCount: result.object.rawItems?.length || 0,
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
    summaryText: result.text.trim(),
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

// Schema for budget recommendations
const budgetRecommendationSchema = z.object({
  monthlyBudget: z.number().describe('Recommended total monthly budget'),
  categoryBudgets: z.array(z.object({
    category: z.string(),
    currentSpending: z.number(),
    recommendedBudget: z.number(),
    savingsPotential: z.number(),
    priority: z.enum(['essential', 'important', 'discretionary']),
  })).describe('Budget recommendations by category'),
  savingsGoal: z.number().describe('Recommended monthly savings amount'),
  keyInsights: z.array(z.string()).describe('Key insights about spending patterns'),
  actionItems: z.array(z.object({
    action: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    potentialSavings: z.number().nullable(),
  })).describe('Actionable items to improve finances'),
});

export type BudgetRecommendation = z.infer<typeof budgetRecommendationSchema>;

export interface BudgetRecommendationResult {
  recommendation: BudgetRecommendation;
  usage: TokenUsage;
}

/**
 * Generate AI-powered budget recommendations based on spending history
 */
export async function generateBudgetRecommendations(
  spendingData: {
    monthlySpending: Array<{ month: string; total: number }>;
    categoryBreakdown: Array<{ category: string; total: number; avgMonthly: number }>;
    topMerchants: Array<{ merchant: string; total: number; frequency: number }>;
    totalSpent: number;
    months: number;
    currency: string;
  },
  userEmail: string,
  userId: string,
  correlationId: CorrelationId,
): Promise<BudgetRecommendationResult> {
  submitLogEvent('budget', 'Generating AI budget recommendations', correlationId, {
    userId,
    userEmail,
    totalSpent: spendingData.totalSpent,
    months: spendingData.months,
  });

  const avgMonthlySpend = spendingData.totalSpent / spendingData.months;

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: budgetRecommendationSchema,
    system: `You are an expert financial advisor helping users create personalized budgets. 
Analyze their spending patterns and provide realistic, achievable budget recommendations.
Consider lifestyle factors and prioritize essential spending while identifying discretionary cuts.
Be specific with numbers and provide actionable advice.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateBudgetRecommendations',
      metadata: { userId, userEmail, correlationId, purpose: 'budget_recommendations' },
    },
    prompt: `Create personalized budget recommendations based on this spending data:

Currency: ${spendingData.currency}
Analysis Period: ${spendingData.months} months
Total Spent: ${spendingData.currency} ${spendingData.totalSpent.toFixed(2)}
Average Monthly: ${spendingData.currency} ${avgMonthlySpend.toFixed(2)}

Monthly Spending Trend:
${spendingData.monthlySpending.map(m => `${m.month}: ${spendingData.currency} ${m.total.toFixed(2)}`).join('\n')}

Category Breakdown (Total / Monthly Avg):
${spendingData.categoryBreakdown.map(c => `${c.category}: ${spendingData.currency} ${c.total.toFixed(2)} (${spendingData.currency} ${c.avgMonthly.toFixed(2)}/month)`).join('\n')}

Top Merchants by Spending:
${spendingData.topMerchants.map(m => `${m.merchant}: ${spendingData.currency} ${m.total.toFixed(2)} (${m.frequency} visits)`).join('\n')}

Provide:
1. A realistic monthly budget target (aim for 10-20% savings)
2. Category-specific budgets based on their patterns
3. Identify essential vs discretionary spending
4. Calculate potential savings for each category
5. 3-5 specific action items with estimated impact`,
    maxTokens: 800,
    temperature: 0.6,
  });

  submitLogEvent('budget', 'Budget recommendations generated', correlationId, {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    model: 'gpt-4o-mini',
    userId,
    recommendedBudget: result.object.monthlyBudget,
  });

  return {
    recommendation: result.object,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}

// Schema for spending anomalies
const spendingAnomalySchema = z.object({
  anomalies: z.array(z.object({
    type: z.enum(['price_spike', 'unusual_merchant', 'frequency_change', 'category_spike', 'large_purchase']),
    severity: z.enum(['info', 'warning', 'alert']),
    title: z.string(),
    description: z.string(),
    amount: z.number().nullable(),
    date: z.string().nullable(),
    merchant: z.string().nullable(),
    category: z.string().nullable(),
    comparison: z.string().nullable().describe('Comparison to normal spending pattern'),
    recommendation: z.string().nullable(),
  })),
  overallRisk: z.enum(['low', 'medium', 'high']).describe('Overall spending risk assessment'),
  summary: z.string().describe('Brief summary of detected anomalies'),
});

export type SpendingAnomaly = z.infer<typeof spendingAnomalySchema>;

export interface SpendingAnomalyResult {
  analysis: SpendingAnomaly;
  usage: TokenUsage;
}

/**
 * Detect spending anomalies and unusual patterns
 */
export async function detectSpendingAnomalies(
  spendingData: {
    recentTransactions: Array<{
      merchant: string;
      amount: number;
      date: string;
      category: string;
    }>;
    historicalAverages: {
      dailyAvg: number;
      weeklyAvg: number;
      monthlyAvg: number;
      categoryAverages: Array<{ category: string; avgMonthly: number }>;
      merchantFrequency: Array<{ merchant: string; avgVisitsPerMonth: number; avgSpend: number }>;
    };
    currency: string;
  },
  userEmail: string,
  userId: string,
  correlationId: CorrelationId,
): Promise<SpendingAnomalyResult> {
  submitLogEvent('anomaly', 'Detecting spending anomalies', correlationId, {
    userId,
    userEmail,
    transactionCount: spendingData.recentTransactions.length,
  });

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: spendingAnomalySchema,
    system: `You are a financial fraud and anomaly detection specialist. 
Analyze spending patterns to identify unusual transactions, price spikes, and behavioral changes.
Be helpful and non-alarming while still flagging potentially concerning patterns.
Focus on actionable insights that help users understand their spending better.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'detectSpendingAnomalies',
      metadata: { userId, userEmail, correlationId, purpose: 'anomaly_detection' },
    },
    prompt: `Analyze these recent transactions for anomalies and unusual patterns:

Currency: ${spendingData.currency}

Historical Averages:
- Daily Average: ${spendingData.currency} ${spendingData.historicalAverages.dailyAvg.toFixed(2)}
- Weekly Average: ${spendingData.currency} ${spendingData.historicalAverages.weeklyAvg.toFixed(2)}
- Monthly Average: ${spendingData.currency} ${spendingData.historicalAverages.monthlyAvg.toFixed(2)}

Category Averages (Monthly):
${spendingData.historicalAverages.categoryAverages.map(c => `${c.category}: ${spendingData.currency} ${c.avgMonthly.toFixed(2)}`).join('\n')}

Typical Merchant Patterns:
${spendingData.historicalAverages.merchantFrequency.map(m => `${m.merchant}: ${m.avgVisitsPerMonth.toFixed(1)} visits/month, avg ${spendingData.currency} ${m.avgSpend.toFixed(2)}/visit`).join('\n')}

Recent Transactions (last 30 days):
${spendingData.recentTransactions.map(t => `${t.date}: ${t.merchant} - ${spendingData.currency} ${t.amount.toFixed(2)} (${t.category})`).join('\n')}

Look for:
1. Prices significantly higher than usual for the same merchant
2. New or unusual merchants
3. Changes in shopping frequency
4. Category spending spikes
5. Unusually large single purchases
6. Potential duplicate charges

Provide helpful context and recommendations for any anomalies found.`,
    maxTokens: 600,
    temperature: 0.4,
  });

  submitLogEvent('anomaly', 'Anomaly detection complete', correlationId, {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    model: 'gpt-4o-mini',
    userId,
    anomalyCount: result.object.anomalies.length,
    overallRisk: result.object.overallRisk,
  });

  return {
    analysis: result.object,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}

// === Spending Forecast Schema ===
const spendingForecastSchema = z.object({
  nextMonthTotal: z.number().describe('Predicted total spending for next month'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in forecast'),
  categoryForecasts: z.array(z.object({
    category: z.string(),
    predictedAmount: z.number(),
    trend: z.enum(['increasing', 'decreasing', 'stable']),
    reasoning: z.string().optional(),
  })).describe('Per-category spending forecasts'),
  upcomingExpenses: z.array(z.object({
    description: z.string(),
    estimatedAmount: z.number(),
    estimatedDate: z.string(),
    isRecurring: z.boolean(),
  })).describe('Expected upcoming expenses based on patterns'),
  savingsOpportunities: z.array(z.object({
    category: z.string(),
    potentialSavings: z.number(),
    suggestion: z.string(),
  })).describe('Areas where user could save money'),
  seasonalFactors: z.array(z.string()).describe('Seasonal factors that may affect spending'),
  summary: z.string().describe('Brief plain-English summary of forecast'),
});

export type SpendingForecastAnalysis = z.infer<typeof spendingForecastSchema>;
export type SpendingForecastResult = {
  analysis: SpendingForecastAnalysis;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
};

/**
 * Generate AI-powered spending forecast based on historical patterns
 */
export async function generateSpendingForecast(
  spendingData: {
    monthlyHistory: Array<{
      month: string;
      total: number;
      categories: Array<{ category: string; amount: number }>;
    }>;
    recentRecurring: Array<{
      merchant: string;
      amount: number;
      frequency: string;
      category: string;
    }>;
    currency: string;
    currentMonth: number;
  },
  userEmail: string,
  userId: string,
  correlationId: CorrelationId,
): Promise<SpendingForecastResult> {
  submitLogEvent('forecast', 'Generating spending forecast', correlationId, {
    userId,
    userEmail,
    monthsOfData: spendingData.monthlyHistory.length,
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const nextMonth = monthNames[(spendingData.currentMonth) % 12];

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: spendingForecastSchema,
    system: `You are a personal finance forecasting assistant.
Analyze spending patterns to predict future expenses and identify savings opportunities.
Be realistic in your predictions and consider seasonal factors.
Provide actionable insights that help users plan their finances.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'generateSpendingForecast',
      metadata: { userId, userEmail, correlationId, purpose: 'spending_forecast' },
    },
    prompt: `Create a spending forecast for ${nextMonth} based on this historical data:

Currency: ${spendingData.currency}

Monthly Spending History:
${spendingData.monthlyHistory.map(m => {
  const categoryBreakdown = m.categories.map(c => `  ${c.category}: ${spendingData.currency} ${c.amount.toFixed(2)}`).join('\n');
  return `${m.month}: ${spendingData.currency} ${m.total.toFixed(2)} total\n${categoryBreakdown}`;
}).join('\n\n')}

Detected Recurring Expenses:
${spendingData.recentRecurring.map(r => `${r.merchant} (${r.category}): ${spendingData.currency} ${r.amount.toFixed(2)} ${r.frequency}`).join('\n')}

Based on this data:
1. Predict total spending for ${nextMonth}
2. Forecast spending by category with trends
3. Identify expected upcoming expenses (subscriptions, regular bills)
4. Find opportunities to save money
5. Note any seasonal factors (holidays, back-to-school, weather-related costs)

Be specific and practical with your predictions and suggestions.`,
    maxTokens: 700,
    temperature: 0.4,
  });

  submitLogEvent('forecast', 'Spending forecast generated', correlationId, {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    model: 'gpt-4o-mini',
    userId,
    predictedTotal: result.object.nextMonthTotal,
    confidence: result.object.confidence,
  });

  return {
    analysis: result.object,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
  };
}
