import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";
export const maxDuration = 60;

async function analyzeReceipt(imageUrl: string) {
  console.log("Fetching image from:", imageUrl);

  const inputImageRes = await fetch(imageUrl);
  if (!inputImageRes.ok) {
    throw new Error(`Failed to download image: ${inputImageRes.statusText}`);
  }

  const contentType = inputImageRes.headers.get("content-type");
  const inputImageBuffer = await inputImageRes.arrayBuffer();

  const buffer = Buffer.from(inputImageBuffer);
  const base64Image = buffer.toString("base64");
  const mimeType = contentType || "image/png";

  console.log("Calling OpenAI Vision API...");

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
- items: array of objects with name, quantity (number), price (number), category (optional), and description (optional) for each item
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
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  let jsonContent = content.trim();
  if (jsonContent.startsWith("```json")) {
    jsonContent = jsonContent.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (jsonContent.startsWith("```")) {
    jsonContent = jsonContent.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return JSON.parse(jsonContent);
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { imageUrl, householdId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 },
      );
    }

    console.log("Processing receipt:", imageUrl);

    // Analyze receipt with OpenAI
    const ocrData = await analyzeReceipt(imageUrl);

    console.log("Receipt analyzed with enhanced data:", {
      merchant: ocrData.merchant,
      total: ocrData.total,
      currency: ocrData.currency,
      category: ocrData.category,
      merchantType: ocrData.merchantType,
      paymentMethod: ocrData.paymentMethod,
      itemCount: ocrData.items?.length || 0,
      hasLocation: !!ocrData.location,
      hasReceiptNumber: !!ocrData.receiptNumber,
      hasTips: !!ocrData.tips,
      hasDiscount: !!ocrData.discount,
      hasLoyaltyNumber: !!ocrData.loyaltyNumber,
      extractedFields: Object.keys(ocrData).length,
    });

    // Save receipt to database with enhanced data
    const [receipt] = await db
      .insert(receipts)
      .values({
        userId: user.id,
        householdId,
        imageUrl,
        merchantName: ocrData.merchant || 'Unknown Merchant',
        totalAmount: ocrData.total?.toString() || '0',
        currency: ocrData.currency || 'USD',
        transactionDate: ocrData.date || new Date().toISOString().split('T')[0],
        location: ocrData.location,
        tax: ocrData.tax?.toString(),
        serviceCharge: ocrData.serviceCharge?.toString(),
        subtotal: ocrData.subtotal?.toString(),
        receiptNumber: ocrData.receiptNumber,
        paymentMethod: ocrData.paymentMethod,
        category: ocrData.category || 'other',
        ocrData: {
          ...ocrData,
          // Store additional extracted details
          merchantType: ocrData.merchantType,
          tips: ocrData.tips,
          discount: ocrData.discount,
          loyaltyNumber: ocrData.loyaltyNumber,
          tableNumber: ocrData.tableNumber,
          serverName: ocrData.serverName,
          orderNumber: ocrData.orderNumber,
          phoneNumber: ocrData.phoneNumber,
          website: ocrData.website,
          vatNumber: ocrData.vatNumber,
          timeOfDay: ocrData.timeOfDay,
          customerCount: ocrData.customerCount,
          specialOffers: ocrData.specialOffers,
          deliveryFee: ocrData.deliveryFee,
          packagingFee: ocrData.packagingFee,
        },
      })
      .returning();

    console.log("Receipt saved to database:", receipt.id);

    // Save receipt items with enhanced data
    if (ocrData.items && Array.isArray(ocrData.items)) {
      const itemsToInsert = ocrData.items.map((item: any) => {
        const quantity = item.quantity || 1;
        const unitPrice = item.price || 0;
        const totalPrice = unitPrice * quantity;
        
        return {
          receiptId: receipt.id,
          name: item.name || 'Unknown Item',
          quantity: quantity,
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString(),
          category: item.category || null,
          description: item.description || null,
        };
      });

      if (itemsToInsert.length > 0) {
        await db.insert(receiptItems).values(itemsToInsert);
        console.log(`Saved ${itemsToInsert.length} receipt items with enhanced data`);
      }
    }

    console.log("Receipt processing completed successfully");

    // Prepare enhanced response with all extracted data
    const items = ocrData.items && Array.isArray(ocrData.items)
      ? ocrData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
          description: item.description,
        }))
      : [];

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        merchantName: receipt.merchantName,
        totalAmount: receipt.totalAmount,
        currency: receipt.currency,
        category: receipt.category,
        location: receipt.location,
        transactionDate: receipt.transactionDate,
        tax: receipt.tax,
        serviceCharge: receipt.serviceCharge,
        subtotal: receipt.subtotal,
        receiptNumber: receipt.receiptNumber,
        paymentMethod: receipt.paymentMethod,
        imageUrl: receipt.imageUrl,
        items,
        itemCount: items.length,
      },
      extractedData: {
        // Core receipt data
        merchant: ocrData.merchant,
        total: ocrData.total,
        currency: ocrData.currency,
        category: ocrData.category,
        date: ocrData.date,
        
        // Business details
        merchantType: ocrData.merchantType,
        location: ocrData.location,
        phoneNumber: ocrData.phoneNumber,
        website: ocrData.website,
        vatNumber: ocrData.vatNumber,
        
        // Transaction details
        paymentMethod: ocrData.paymentMethod,
        receiptNumber: ocrData.receiptNumber,
        orderNumber: ocrData.orderNumber,
        timeOfDay: ocrData.timeOfDay,
        
        // Financial breakdown
        subtotal: ocrData.subtotal,
        tax: ocrData.tax,
        serviceCharge: ocrData.serviceCharge,
        tips: ocrData.tips,
        discount: ocrData.discount,
        deliveryFee: ocrData.deliveryFee,
        packagingFee: ocrData.packagingFee,
        
        // Service details
        tableNumber: ocrData.tableNumber,
        serverName: ocrData.serverName,
        customerCount: ocrData.customerCount,
        
        // Loyalty & promotions
        loyaltyNumber: ocrData.loyaltyNumber,
        specialOffers: ocrData.specialOffers,
        
        // Items with enhanced details
        items: items,
        itemCount: items.length,
      }
    });
  } catch (error) {
    console.error("Receipt processing error:", error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
