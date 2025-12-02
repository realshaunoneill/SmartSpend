import OpenAI from "openai";
import { submitLogEvent } from "@/lib/logging";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReceiptData {
  merchant?: string;
  total?: number;
  currency?: string;
  date?: string;
  category?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price: number;
    category?: string;
    description?: string;
  }>;
  rawItems?: Array<{
    name: string;
    price: number;
  }>;
  location?: string;
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  merchantType?: string;
  tips?: number;
  discount?: number;
  loyaltyNumber?: string;
  tableNumber?: string;
  serverName?: string;
  orderNumber?: string;
  phoneNumber?: string;
  website?: string;
  vatNumber?: string;
  timeOfDay?: string;
  customerCount?: number;
  specialOffers?: string;
  deliveryFee?: number;
  packagingFee?: number;
}

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
 * Analyze receipt image using GPT-4o (for /api/receipt/process)
 * This is the main receipt processing function with full extraction
 */
export async function analyzeReceiptWithGPT4o(
  imageUrl: string,
  userEmail: string,
  userId: string
): Promise<ReceiptAnalysisResult> {
  submitLogEvent('receipt-process', "Fetching image for analysis", null, { imageUrl, userId });

  const inputImageRes = await fetch(imageUrl);
  if (!inputImageRes.ok) {
    throw new Error(`Failed to download image: ${inputImageRes.statusText}`);
  }

  const contentType = inputImageRes.headers.get("content-type");
  const inputImageBuffer = await inputImageRes.arrayBuffer();

  const buffer = Buffer.from(inputImageBuffer);
  const base64Image = buffer.toString("base64");
  const mimeType = contentType || "image/png";

  submitLogEvent('receipt-process', "Calling OpenAI Vision API", null, { userId, userEmail });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this receipt image and extract the following information in JSON format:

REQUIRED FIELDS:
- merchant: merchant/store name
- total: total amount (number)
- currency: currency code (e.g., "GBP", "USD", "EUR")
- date: transaction date (format as YYYY-MM-DD, use current date if not visible)
- category: spending category based on merchant and items (choose from: "groceries", "dining", "transportation", "shopping", "entertainment", "healthcare", "utilities", "travel", "gas", "coffee", "pharmacy", "clothing", "electronics", "home", "other")

DETAILED EXTRACTION:
- items: array of objects with name, quantity (number), price (number - this is the TOTAL price for this line item, not unit price), category (optional), and description (optional) for each item
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

Return ONLY valid JSON with all numeric values as numbers (not strings), no additional text.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
    user: userEmail,
    metadata: {
      userId: userId,
      userEmail: userEmail,
      purpose: "receipt_processing",
    },
  });

  const usage = response.usage;
  
  submitLogEvent('receipt-process', "OpenAI API usage", null, {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    model: "gpt-4o",
    userEmail,
    userId,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return {
    data: cleanJsonResponse(content),
    usage: {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    },
  };
}

/**
 * Simple receipt analysis for upload route (basic extraction)
 */
export async function analyzeReceiptSimple(imageUrl: string): Promise<any> {
  try {
    const inputImageRes = await fetch(imageUrl);
    if (!inputImageRes.ok) {
      throw new Error(`Failed to download image: ${inputImageRes.statusText}`);
    }

    const contentType = inputImageRes.headers.get("content-type");
    const inputImageBuffer = await inputImageRes.arrayBuffer();

    const buffer = Buffer.from(inputImageBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = contentType || "image/png";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and extract the following information in JSON format:
- items: array of objects with name, quantity, and price for each item
- location: store location/address
- merchant: merchant/store name
- date: transaction date (if visible)
- subtotal: subtotal amount before tax and service charges (if visible)
- tax: tax amount (if visible)
- serviceCharge: service charge amount (if visible)
- total: total amount
- currency: currency code (e.g., "GBP", "USD", "EUR")
- paymentMethod: payment method used (if visible, e.g., "Card", "Cash")
- receiptNumber: receipt or transaction number (if visible)

Return ONLY valid JSON, no additional text.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return cleanJsonResponse(content);
  } catch (error) {
    submitLogEvent('receipt-error', `Receipt analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { imageUrl }, true);
    throw error;
  }
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
  userId: string
): Promise<SpendingInsight> {
  submitLogEvent('receipt', "Generating AI spending summary", null, {
    userId,
    userEmail,
    totalItems: aggregatedData.totalItems,
    totalSpent: aggregatedData.totalSpent,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful financial advisor analyzing spending patterns. Provide insights, identify trends, and offer actionable advice. Be concise but insightful. Use a friendly, conversational tone.",
      },
      {
        role: "user",
        content: `Analyze this spending data and provide a summary with insights and recommendations:

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
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
    user: userEmail,
    metadata: {
      userId: userId,
      userEmail: userEmail,
      purpose: "spending_summary",
    },
  });

  const usage = response.usage;
  
  submitLogEvent('receipt', "AI spending summary generated", null, {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    model: "gpt-4o-mini",
    userEmail,
    userId,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No summary generated from OpenAI");
  }

  return {
    summary: content.trim(),
    usage: {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    },
  };
}

/**
 * Clean and parse JSON response from OpenAI
 */
export function cleanJsonResponse(content: string): any {
  let jsonContent = content.trim();
  
  // Remove markdown code blocks
  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/^```\n/, "").replace(/\n```$/, "");
  }
  
  return JSON.parse(jsonContent);
}

export { openai };
