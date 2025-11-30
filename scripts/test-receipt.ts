import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testReceipt() {
  try {
    const imagePath = path.join(process.cwd(), "public", "receipt.png");
    
    if (!fs.existsSync(imagePath)) {
      console.error("Receipt image not found at:", imagePath);
      return;
    }

    console.log("Reading receipt image from:", imagePath);
    
    // Read and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    console.log("Sending to OpenAI...\n");

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
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error("No response from OpenAI");
      return;
    }

    console.log("Raw response:");
    console.log(content);
    console.log("\n---\n");

    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Parse and pretty print
    const receiptData = JSON.parse(jsonContent);
    console.log("Parsed receipt data:");
    console.log(JSON.stringify(receiptData, null, 2));

  } catch (error) {
    console.error("Error processing receipt:", error);
  }
}

testReceipt();
