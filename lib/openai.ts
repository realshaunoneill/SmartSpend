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
 * Process receipt image using GPT-4.1 Vision API to extract basic receipt data
 */
export async function processReceiptImage(
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

  submitLogEvent('receipt-process', "Calling OpenAI Vision API with GPT-4.1", null, { userId, userEmail });

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo", // GPT-4.1 for image processing
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
- rawItems: array of raw line items with name and price (number - total price for line item) as they appear on receipt
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
      purpose: "receipt_image_processing",
    },
  });

  const usage = response.usage;
  
  submitLogEvent('receipt-process', "GPT-4.1 image processing completed", null, {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    model: "gpt-4-turbo",
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
 * Process line items using GPT-4o to enhance and categorize items
 */
export async function processLineItems(
  rawItems: Array<{ name: string; price: number }>,
  merchantType: string,
  category: string,
  userEmail: string,
  userId: string
): Promise<{ items: ReceiptData['items']; usage: TokenUsage }> {
  if (!rawItems || rawItems.length === 0) {
    return { 
      items: [], 
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } 
    };
  }

  submitLogEvent('receipt-process', "Processing line items with GPT-4o", null, { 
    userId, 
    userEmail, 
    itemCount: rawItems.length,
    merchantType,
    category 
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // GPT-4o for line item processing
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing receipt line items. Your job is to enhance raw receipt items with detailed information including quantity, category, and description.

Merchant Type: ${merchantType}
Receipt Category: ${category}

For each item, provide:
- name: cleaned/standardized item name
- quantity: estimated quantity (default 1 if not clear)
- price: total price for this line item (number)
- category: specific item category (e.g., "produce", "dairy", "meat", "beverages", "snacks", "household", "personal_care", "frozen", "bakery", "deli", "seafood", "condiments", "spices", "alcohol", "tobacco", "pharmacy", "electronics", "clothing", "books", "toys", "automotive", "garden", "pet_supplies", "office", "other")
- description: brief description or additional details about the item (optional)

Return ONLY valid JSON array with enhanced items.`
      },
      {
        role: "user",
        content: `Enhance these receipt items:

${rawItems.map((item, index) => `${index + 1}. ${item.name} - $${item.price}`).join('\n')}

Return as JSON array with enhanced item details.`
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
    user: userEmail,
    metadata: {
      userId: userId,
      userEmail: userEmail,
      purpose: "line_item_processing",
    },
  });

  const usage = response.usage;
  
  submitLogEvent('receipt-process', "GPT-4o line item processing completed", null, {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    model: "gpt-4o",
    userEmail,
    userId,
    processedItems: rawItems.length,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No line items response from OpenAI");
  }

  const enhancedItems = cleanJsonResponse(content);

  return {
    items: Array.isArray(enhancedItems) ? enhancedItems : [],
    usage: {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    },
  };
}

/**
 * Analyze receipt image using both GPT-4.1 and GPT-4o (legacy function for backward compatibility)
 */
export async function analyzeReceiptImage(
  imageUrl: string,
  userEmail: string,
  userId: string
): Promise<ReceiptAnalysisResult> {
  // First, process the image with GPT-4.1
  const imageResult = await processReceiptImage(imageUrl, userEmail, userId);
  
  // Then, enhance line items with GPT-4o if raw items exist
  let enhancedItems: ReceiptData['items'] = [];
  let itemsUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  
  if (imageResult.data.rawItems && imageResult.data.rawItems.length > 0) {
    const itemsResult = await processLineItems(
      imageResult.data.rawItems,
      imageResult.data.merchantType || 'other',
      imageResult.data.category || 'other',
      userEmail,
      userId
    );
    enhancedItems = itemsResult.items;
    itemsUsage = itemsResult.usage;
  }

  // Combine results
  const combinedData = {
    ...imageResult.data,
    items: enhancedItems,
  };

  // Remove rawItems from final result
  delete combinedData.rawItems;

  return {
    data: combinedData,
    usage: {
      promptTokens: imageResult.usage.promptTokens + itemsUsage.promptTokens,
      completionTokens: imageResult.usage.completionTokens + itemsUsage.completionTokens,
      totalTokens: imageResult.usage.totalTokens + itemsUsage.totalTokens,
    },
  };
}

/**
 * Generate spending insights using GPT-4o
 */
export async function generateSpendingInsights(
  aggregatedData: {
    period: { startDate: string; endDate: string; months: number };
    statistics: {
      totalItems: number;
      totalSpent: number;
      currency: string;
      averagePerItem: number;
    };
    topItems: Array<{ name: string; count: number; totalSpent: number }>;
    topCategories: Array<{ category: string; count: number; totalSpent: number }>;
    topMerchants: Array<{ merchant: string; count: number; totalSpent: number }>;
  },
  userEmail: string,
  userId: string
): Promise<SpendingInsight> {
  submitLogEvent('receipt', "Generating AI spending insights", null, {
    userId,
    userEmail,
    months: aggregatedData.period.months,
    totalItems: aggregatedData.statistics.totalItems,
    totalSpent: aggregatedData.statistics.totalSpent,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for text analysis
    messages: [
      {
        role: "system",
        content: "You are a financial advisor analyzing spending patterns. Provide insights, identify trends, and suggest savings opportunities based on the data provided. Be specific, actionable, and helpful.",
      },
      {
        role: "user",
        content: `Analyze this spending data and provide insights:

SPENDING PERIOD: ${aggregatedData.period.months} months (${aggregatedData.period.startDate} to ${aggregatedData.period.endDate})

OVERALL STATISTICS:
- Total items purchased: ${aggregatedData.statistics.totalItems}
- Total spent: ${aggregatedData.statistics.currency} ${aggregatedData.statistics.totalSpent}
- Average per item: ${aggregatedData.statistics.currency} ${aggregatedData.statistics.averagePerItem}

TOP ITEMS (by frequency):
${aggregatedData.topItems.slice(0, 10).map(item => 
  `- ${item.name}: ${item.count} purchases, ${aggregatedData.statistics.currency} ${item.totalSpent} total`
).join('\n')}

TOP CATEGORIES (by spending):
${aggregatedData.topCategories.slice(0, 5).map(cat => 
  `- ${cat.category}: ${cat.count} items, ${aggregatedData.statistics.currency} ${cat.totalSpent} spent`
).join('\n')}

TOP MERCHANTS (by frequency):
${aggregatedData.topMerchants.slice(0, 5).map(merchant => 
  `- ${merchant.merchant}: ${merchant.count} visits, ${aggregatedData.statistics.currency} ${merchant.totalSpent} spent`
).join('\n')}

Please provide:
1. A brief overview of spending patterns
2. Key insights about habits and preferences
3. Potential savings opportunities
4. Notable trends or patterns
5. Actionable recommendations

Keep the response concise but informative (300-400 words).`,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
    user: userEmail,
    metadata: {
      userId: userId,
      userEmail: userEmail,
      purpose: "spending_insights",
    },
  });

  const usage = response.usage;
  
  submitLogEvent('receipt', "AI insights generated", null, {
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    model: "gpt-4o",
    userEmail,
    userId,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No insights generated from OpenAI");
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