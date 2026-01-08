import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, receipts, receiptItems, users } from '@/lib/db/schema';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { analyzeReceiptWithGPT4o } from '@/lib/openai';
import { randomUUID } from 'crypto';
import { eq, and, isNull } from 'drizzle-orm';
import { invalidateInsightsCache } from '@/lib/utils/cache-helpers';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Authenticate using API key
async function authenticateApiKey(apiKey: string) {
  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.key, apiKey),
        eq(apiKeys.isRevoked, false)
      )
    )
    .limit(1);

  if (!keyRecord) {
    return null;
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, keyRecord.userId))
    .limit(1);

  return user || null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  try {
    // Get API key from header
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401, headers }
      );
    }

    const user = await authenticateApiKey(apiKey);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers }
      );
    }

    const body = await req.json();
    const { receiptId } = body;

    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400, headers }
      );
    }

    // Get the receipt
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.id, receiptId),
          eq(receipts.userId, user.id),
          isNull(receipts.deletedAt)
        )
      )
      .limit(1);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404, headers }
      );
    }

    if (receipt.processingStatus === 'completed') {
      return NextResponse.json(
        { message: 'Receipt already processed', receiptId },
        { headers }
      );
    }

    // Update to processing
    await db
      .update(receipts)
      .set({
        processingStatus: 'processing',
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(receipts.id, receiptId));

    submitLogEvent('extension-process', 'Processing receipt from extension', correlationId, {
      receiptId,
      userId: user.id,
    });

    // Analyze with OpenAI
    const result = await analyzeReceiptWithGPT4o(
      receipt.imageUrl,
      user.email,
      user.id,
      correlationId
    );

    const { data: ocrData, usage } = result;

    // Determine currency
    const currency = ocrData.currency?.toUpperCase() || user.currency || DEFAULT_CURRENCY;

    // Update receipt with OCR results
    await db
      .update(receipts)
      .set({
        merchantName: ocrData.merchant || null,
        totalAmount: ocrData.total?.toString() || null,
        currency: currency,
        transactionDate: ocrData.date || null,
        category: ocrData.category || null,
        paymentMethod: ocrData.paymentMethod || null,
        location: ocrData.location || null,
        tax: ocrData.tax?.toString() || null,
        serviceCharge: ocrData.serviceCharge?.toString() || null,
        subtotal: ocrData.subtotal?.toString() || null,
        receiptNumber: ocrData.receiptNumber || null,
        ocrData: ocrData,
        processingTokens: usage,
        processingStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(receipts.id, receiptId));

    // Insert receipt items
    if (ocrData.items && Array.isArray(ocrData.items) && ocrData.items.length > 0) {
      const itemValues = ocrData.items.map((item) => ({
        receiptId: receiptId,
        name: item.name,
        quantity: item.quantity?.toString() || null,
        unitPrice: null,
        totalPrice: item.price?.toString() || null,
        price: item.price?.toString() || null,
        category: item.category || null,
        description: item.description || null,
        modifiers: item.modifiers || null,
      }));

      await db.insert(receiptItems).values(itemValues);
    }

    // Invalidate cache
    await invalidateInsightsCache(user.id, receipt.householdId || undefined, correlationId);

    submitLogEvent('extension-process', 'Receipt processed successfully', correlationId, {
      receiptId,
      userId: user.id,
      merchant: ocrData.merchant,
    });

    return NextResponse.json(
      {
        success: true,
        receiptId,
        merchant: ocrData.merchant,
        total: ocrData.total,
        currency,
      },
      { headers }
    );
  } catch (error) {
    submitLogEvent('extension-process', `Processing error: ${error instanceof Error ? error.message : 'Unknown'}`, correlationId, {
      error: error instanceof Error ? error.stack : undefined,
    }, true);

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
