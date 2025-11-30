import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  items: ReceiptItem[];
  location: string;
  merchant?: string;
  date?: string;
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No receipt image URL provided" },
        { status: 400 }
      );
    }

    // Fetch the image from the URL
    const inputImageRes = await fetch(imageUrl);
    if (!inputImageRes.ok) {
      return NextResponse.json(
        { error: `Failed to download image: ${inputImageRes.statusText}` },
        { status: 400 }
      );
    }

    // Get the content type from the response
    const contentType = inputImageRes.headers.get("content-type");
    const extension = contentType?.includes("jpeg")
      ? "jpg"
      : contentType?.includes("png")
        ? "png"
        : contentType?.includes("webp")
          ? "webp"
          : "png"; // fallback to png if we can't determine the type

    const inputImageBuffer = await inputImageRes.arrayBuffer();

    // Convert to base64
    const buffer = Buffer.from(inputImageBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = contentType || "image/png";

    // Call OpenAI Vision API
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
      return NextResponse.json(
        { error: "Failed to extract receipt data" },
        { status: 500 }
      );
    }

    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Parse the JSON response
    const receiptData: ReceiptData = JSON.parse(jsonContent);

    return NextResponse.json(receiptData);
  } catch (err) {
    console.error("Receipt processing error:", err);
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}