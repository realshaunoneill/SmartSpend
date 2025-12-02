import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { analyzeReceiptWithGPT4o } from "@/lib/openai";
import { submitLogEvent } from "@/lib/logging";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Clerk user email
    const email = await getClerkUserEmail(clerkId);
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email);

    const body = await req.json();
    const { imageUrl, householdId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 },
      );
    }

    submitLogEvent('receipt-process', "Processing receipt", null, { imageUrl, userId: user.id, householdId });

    // Analyze receipt with OpenAI
    let ocrData, usage;
    try {
      const result = await analyzeReceiptWithGPT4o(imageUrl, email, user.id);
      ocrData = result.data;
      usage = result.usage;
    } catch (error) {
      // Save failed receipt to database
      const [failedReceipt] = await db
        .insert(receipts)
        .values({
          userId: user.id,
          householdId,
          imageUrl,
          processingStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error',
        })
        .returning();

      submitLogEvent('receipt-error', `Receipt processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { 
        receiptId: failedReceipt.id,
        error: error instanceof Error ? error.stack : undefined 
      }, true);

      return NextResponse.json(
        {
          error: "Failed to process receipt",
          message: error instanceof Error ? error.message : 'Unknown error',
          receiptId: failedReceipt.id,
        },
        { status: 500 },
      );
    }

    submitLogEvent('receipt-process', "Receipt analyzed with enhanced data", null, {
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
      userId: user.id,
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
        processingStatus: 'completed', // Mark as successfully processed
        processingTokens: usage, // Store token usage for cost calculation
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

    submitLogEvent('receipt', "Receipt saved to database", null, {
      receiptId: receipt.id,
      tokenUsage: usage,
      userEmail: email,
      userId: user.id,
      merchantName: receipt.merchantName,
      totalAmount: receipt.totalAmount,
    });

    // Save receipt items with enhanced data
    if (ocrData.items && Array.isArray(ocrData.items)) {
      const itemsToInsert = ocrData.items.map((item: any) => {
        const quantity = item.quantity || 1;
        const totalPrice = item.price || 0; // This is the total price for the line item
        const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;
        
        return {
          receiptId: receipt.id,
          name: item.name || 'Unknown Item',
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString(),
          price: totalPrice.toString(), // For backward compatibility with UI
          category: item.category || null,
          description: item.description || null,
        };
      });

      if (itemsToInsert.length > 0) {
        await db.insert(receiptItems).values(itemsToInsert);
        submitLogEvent('receipt', `Saved ${itemsToInsert.length} receipt items with enhanced data`, null, { receiptId: receipt.id, itemCount: itemsToInsert.length, userId: user.id });
      }
    }

    submitLogEvent('receipt-process', "Receipt processing completed successfully", null, { receiptId: receipt.id, userId: user.id });

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
    submitLogEvent('receipt-error', `Receipt processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { error: error instanceof Error ? error.stack : undefined }, true);
    return NextResponse.json(
      {
        error: (error as Error).message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
