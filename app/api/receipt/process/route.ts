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

    console.log("Receipt analyzed:", {
      merchant: ocrData.merchant,
      total: ocrData.total,
      currency: ocrData.currency,
      itemCount: ocrData.items?.length || 0,
    });

    // Save receipt to database
    const [receipt] = await db
      .insert(receipts)
      .values({
        userId: user.id,
        householdId,
        imageUrl,
        merchantName: ocrData.merchant,
        totalAmount: ocrData.total?.toString(),
        currency: ocrData.currency,
        transactionDate: ocrData.date,
        location: ocrData.location,
        tax: ocrData.tax?.toString(),
        serviceCharge: ocrData.serviceCharge?.toString(),
        subtotal: ocrData.subtotal?.toString(),
        receiptNumber: ocrData.receiptNumber,
        paymentMethod: ocrData.paymentMethod,
        ocrData: ocrData,
      })
      .returning();

    console.log("Receipt saved to database:", receipt.id);

    // Save receipt items
    if (ocrData.items && Array.isArray(ocrData.items)) {
      const itemsToInsert = ocrData.items.map((item: any) => ({
        receiptId: receipt.id,
        name: item.name,
        quantity: item.quantity?.toString(),
        price: item.price?.toString(),
      }));

      if (itemsToInsert.length > 0) {
        await db.insert(receiptItems).values(itemsToInsert);
        console.log(`Saved ${itemsToInsert.length} receipt items`);
      }
    }

    console.log("Receipt processing completed successfully");

    return NextResponse.json({
      id: receipt.id,
      merchantName: receipt.merchantName,
      totalAmount: receipt.totalAmount,
      currency: receipt.currency,
      location: receipt.location,
      transactionDate: receipt.transactionDate,
      itemCount: ocrData.items?.length || 0,
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
