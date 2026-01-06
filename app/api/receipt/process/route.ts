import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, receiptItems } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription } from '@/lib/auth-helpers';
import { analyzeReceiptWithGPT4o } from '@/lib/openai';
import type { OCRItem } from '@/lib/types/api-responses';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';
import { invalidateInsightsCache } from '@/lib/utils/cache-helpers';
import { eq, and, isNull } from 'drizzle-orm';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check subscription for receipt processing
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    const body = await req.json();
    const { receiptId } = body;

    if (!receiptId) {
      submitLogEvent('receipt-error', 'No receiptId provided to process endpoint', correlationId, {
        body,
        userId: user.id,
      }, true);
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 },
      );
    }

    // Get the existing receipt from database
    const [existingReceipt] = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.userId, user.id),
          isNull(receipts.deletedAt),
        ),
      )
      .limit(1);

    if (!existingReceipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 },
      );
    }

    if (existingReceipt.processingStatus === 'completed') {
      return NextResponse.json(
        { error: 'Receipt already processed' },
        { status: 400 },
      );
    }

    const imageUrl = existingReceipt.imageUrl;
    const householdId = existingReceipt.householdId;

    submitLogEvent('receipt-process-start', 'Starting receipt processing', correlationId, {
      receiptId,
      imageUrl,
      userId: user.id,
      userEmail: user.email,
      householdId,
      timestamp: new Date().toISOString(),
    });

    // Update status to processing
    await db
      .update(receipts)
      .set({
        processingStatus: 'processing',
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(receipts.id, receiptId));

    submitLogEvent('receipt-status-processing', 'Receipt status updated to processing', correlationId, {
      receiptId,
      userId: user.id,
      status: 'processing',
      timestamp: new Date().toISOString(),
    });

    // Analyze receipt with OpenAI
    let ocrData, usage;
    try {
      const result = await analyzeReceiptWithGPT4o(imageUrl, user.email, user.id, correlationId);
      ocrData = result.data;
      usage = result.usage;
    } catch (error) {
      // Build detailed error info for debugging
      const errorDetails: Record<string, unknown> = {
        receiptId,
        userId: user.id,
        imageUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      };

      // Check for AI SDK specific error properties
      if (error && typeof error === 'object') {
        if ('text' in error) {
          errorDetails.rawAIResponse = (error as { text?: string }).text;
        }
        if ('cause' in error) {
          errorDetails.errorCause = (error as { cause?: unknown }).cause;
        }
        if ('issues' in error) {
          errorDetails.validationIssues = (error as { issues?: unknown }).issues;
        }
      }

      // Update receipt status to failed
      await db
        .update(receipts)
        .set({
          processingStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(receipts.id, receiptId));

      submitLogEvent('receipt-error', `Receipt processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, errorDetails, true);

      return NextResponse.json(
        {
          error: 'Failed to process receipt',
          message: error instanceof Error ? error.message : 'Unknown error',
          receiptId,
        },
        { status: 500 },
      );
    }

    submitLogEvent('receipt-process', 'Receipt analyzed with enhanced data', correlationId, {
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

    // Update receipt in database with enhanced data
    const [receipt] = await db
      .update(receipts)
      .set({
        merchantName: ocrData.merchant || 'Unknown Merchant',
        totalAmount: ocrData.total?.toString() || '0',
        currency: ocrData.currency || user.currency || DEFAULT_CURRENCY,
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
        processingError: null, // Clear any previous error
        updatedAt: new Date(),
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
      .where(eq(receipts.id, receiptId))
      .returning();

    submitLogEvent('receipt-process-complete', 'Receipt updated in database with OCR data', correlationId, {
      receiptId: receipt.id,
      tokenUsage: usage,
      userEmail: user.email,
      userId: user.id,
      merchantName: receipt.merchantName,
      totalAmount: receipt.totalAmount,
      timestamp: new Date().toISOString(),
    });

    // Save receipt items with enhanced data
    if (ocrData.items && Array.isArray(ocrData.items)) {
      const itemsToInsert = ocrData.items.map((item: OCRItem) => {
        const quantityRaw = item.quantity || 1;
        const quantity = typeof quantityRaw === 'string' ? parseFloat(quantityRaw) : quantityRaw;
        const priceRaw = item.price || 0;
        const totalPrice = typeof priceRaw === 'string' ? parseFloat(priceRaw) : priceRaw;
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
          modifiers: item.modifiers || null, // Store modifiers (deposits, fees, discounts, etc.)
        };
      });

      if (itemsToInsert.length > 0) {
        await db.insert(receiptItems).values(itemsToInsert);
        submitLogEvent('receipt', `Saved ${itemsToInsert.length} receipt items with enhanced data`, correlationId, { receiptId: receipt.id, itemCount: itemsToInsert.length, userId: user.id });
      }
    }

    submitLogEvent('receipt-process', 'Receipt processing completed successfully', correlationId, { receiptId: receipt.id, userId: user.id });

    // Invalidate insights cache for this user
    await invalidateInsightsCache(user.id, householdId, correlationId);

    // Prepare enhanced response with all extracted data
    const items = ocrData.items && Array.isArray(ocrData.items)
      ? ocrData.items.map((item: OCRItem) => ({
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
      },
    });
  } catch (error) {
    submitLogEvent('receipt-error', `Receipt processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { error: error instanceof Error ? error.stack : undefined }, true);
    return NextResponse.json(
      {
        error: (error as Error).message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
