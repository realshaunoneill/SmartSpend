import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts, receiptItems } from '@/lib/db/schema';
import { getAuthenticatedUser, filterReceiptForSubscription } from '@/lib/auth-helpers';
import { analyzeReceiptWithGPT4o } from '@/lib/openai';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { invalidateInsightsCache } from '@/lib/utils/cache-helpers';
import type { OCRItem } from '@/lib/types/api-responses';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/receipts/[id]/retry
 * Retry processing a failed receipt
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user, email } = authResult;

    const { id: receiptId } = await params;

    // Get the receipt
    const [receipt] = await db
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

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (receipt.processingStatus === 'completed') {
      return NextResponse.json({ error: 'Receipt already processed' }, { status: 400 });
    }

    submitLogEvent('receipt', 'Retrying receipt processing', correlationId, {
      receiptId: receipt.id,
      userId: user.id,
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

    // Analyze receipt with OpenAI
    let ocrData, usage;
    try {
      const result = await analyzeReceiptWithGPT4o(receipt.imageUrl, email, user.id, correlationId);
      ocrData = result.data;
      usage = result.usage;
    } catch (error) {
      // Update with error
      await db
        .update(receipts)
        .set({
          processingStatus: 'failed',
          processingError: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(receipts.id, receiptId));

      submitLogEvent('receipt-error', `Receipt retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {
        receiptId: receipt.id,
        error: error instanceof Error ? error.stack : undefined,
      }, true);

      return NextResponse.json(
        {
          error: 'Failed to process receipt',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }

    // Update receipt with processed data
    const [updatedReceipt] = await db
      .update(receipts)
      .set({
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
        processingStatus: 'completed',
        processingError: null,
        processingTokens: usage,
        ocrData: {
          ...ocrData,
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
        updatedAt: new Date(),
      })
      .where(eq(receipts.id, receiptId))
      .returning();

    // Save receipt items
    if (ocrData.items && Array.isArray(ocrData.items)) {
      // Delete existing items if any
      await db.delete(receiptItems).where(eq(receiptItems.receiptId, receiptId));

      const itemsToInsert = ocrData.items.map((item: OCRItem) => {
        const quantityRaw = item.quantity || 1;
        const quantity = typeof quantityRaw === 'string' ? parseFloat(quantityRaw) : quantityRaw;
        const priceRaw = item.price || 0;
        const totalPrice = typeof priceRaw === 'string' ? parseFloat(priceRaw) : priceRaw;
        const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

        return {
          receiptId: receiptId,
          name: item.name || 'Unknown Item',
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString(),
          price: totalPrice.toString(),
          category: item.category || null,
          description: item.description || null,
          modifiers: item.modifiers || null, // Store modifiers
        };
      });

      if (itemsToInsert.length > 0) {
        await db.insert(receiptItems).values(itemsToInsert);
      }
    }

    submitLogEvent('receipt', 'Receipt retry successful', correlationId, {
      receiptId: receipt.id,
      userId: user.id,
    });

    // Invalidate insights cache since receipt data changed
    await invalidateInsightsCache(user.id, receipt.householdId, correlationId);

    // Filter based on subscription status
    const filteredReceipt = filterReceiptForSubscription(updatedReceipt, user.subscribed);

    return NextResponse.json({
      success: true,
      receipt: filteredReceipt,
    });
  } catch (error) {
    submitLogEvent('receipt-error', `Receipt retry error: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {
      error: error instanceof Error ? error.stack : undefined,
    }, true);

    return NextResponse.json(
      {
        error: (error as Error).message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
