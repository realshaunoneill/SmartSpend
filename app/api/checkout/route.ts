import { type NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import Stripe from 'stripe';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Verify the price exists and is active
    try {
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });

      if (!price.active) {
        return NextResponse.json(
          { error: 'This subscription plan is not available' },
          { status: 400 },
        );
      }

      submitLogEvent('checkout', `Creating checkout session for price: ${(price.product as Stripe.Product).name}`, correlationId, { userId: user.id, priceId, email: user.email });
    } catch (error) {
      submitLogEvent('checkout', `Error retrieving price: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { userId: user.id, priceId }, true);
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 },
      );
    }

    // Create checkout session (handles customer creation automatically)
    const checkoutSession = await createCheckoutSession(
      user.id,
      user.email,
      user.clerkId,
      priceId,
      user.stripeCustomerId,
      body.successUrl,
      body.cancelUrl,
      correlationId,
    );

    if (!checkoutSession || !checkoutSession.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 },
      );
    }

    submitLogEvent('checkout', 'Checkout session created', correlationId, {
      sessionId: checkoutSession.id,
      userId: user.id,
      priceId,
    });

    return NextResponse.json(
      {
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
      { status: 200 },
    );
  } catch (error) {
    submitLogEvent('checkout', `Error creating checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { error: error instanceof Error ? error.message : undefined }, true);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
