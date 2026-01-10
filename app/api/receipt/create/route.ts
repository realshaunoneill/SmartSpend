import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { receipts } from '@/lib/db/schema';
import { getAuthenticatedUser, requireSubscription } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { getPostHogClient } from '@/lib/posthog-server';
import { randomUUID } from 'crypto';

// Route configuration
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user, clerkId } = authResult;

    // Check subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    const body = await req.json();
    const { imageUrl, householdId: providedHouseholdId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      );
    }

    submitLogEvent('receipt-upload-start', 'Creating receipt database entry', correlationId, {
      userId: user.id,
      userEmail: user.email,
      clerkId,
      imageUrl,
      householdId: providedHouseholdId,
      timestamp: new Date().toISOString(),
    });

    // Use provided householdId or fall back to user's default
    const householdId = providedHouseholdId || user.defaultHouseholdId;

    if (householdId && user.defaultHouseholdId && householdId !== user.defaultHouseholdId) {
      submitLogEvent('receipt-upload', 'Using provided household for receipt', correlationId, {
        providedHouseholdId: householdId,
        defaultHouseholdId: user.defaultHouseholdId,
      });
    } else if (householdId && !providedHouseholdId) {
      submitLogEvent('receipt-upload', 'Using default household for receipt', correlationId, {
        defaultHouseholdId: user.defaultHouseholdId,
      });
    }

    // Create receipt entry in database with pending status
    const [receipt] = await db
      .insert(receipts)
      .values({
        userId: user.id,
        householdId,
        imageUrl,
        processingStatus: 'pending',
      })
      .returning();

    submitLogEvent('receipt-db-created', 'Receipt entry created in database with pending status', correlationId, {
      receiptId: receipt.id,
      userId: user.id,
      userEmail: user.email,
      clerkId,
      imageUrl,
      householdId,
      processingStatus: 'pending',
      timestamp: new Date().toISOString(),
    });

    // Track receipt upload event in PostHog (if enabled)
    const posthog = getPostHogClient();
    posthog?.capture({
      distinctId: clerkId,
      event: 'receipt_uploaded',
      properties: {
        receiptId: receipt.id,
        householdId,
        imageUrl,
        hasHousehold: !!householdId,
        timestamp: new Date().toISOString(),
      },
    });

    submitLogEvent('receipt-upload-complete', 'Receipt upload flow completed, ready for processing', correlationId, {
      receiptId: receipt.id,
      userId: user.id,
      imageUrl,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      receiptId: receipt.id,
      processingStatus: 'pending',
      imageUrl,
    });
  } catch (error) {
    submitLogEvent('receipt-error', `Failed to create receipt entry: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {
      error: error instanceof Error ? error.stack : undefined,
    }, true);

    return NextResponse.json(
      {
        error: 'Failed to create receipt entry',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
