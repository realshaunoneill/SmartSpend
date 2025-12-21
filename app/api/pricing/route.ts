import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { unstable_cache } from 'next/cache';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 3600; // Cache for 1 hour

// Cached function to fetch price details
const getCachedPriceDetails = unstable_cache(
  async (correlationId: CorrelationId) => {
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      submitLogEvent('pricing', 'Price ID not configured', correlationId, {}, true);
      throw new Error('Price ID not configured');
    }

    submitLogEvent('pricing', 'Fetching price details from Stripe', correlationId, { priceId });

    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    if (!price.active) {
      submitLogEvent('pricing', 'Price is not active', correlationId, { priceId, active: price.active }, true);
      throw new Error('This subscription plan is not available');
    }

    const product = price.product as Stripe.Product;

    const priceDetails = {
      priceId: price.id,
      amount: price.unit_amount || 0,
      currency: price.currency,
      interval: price.recurring?.interval || 'month',
      intervalCount: price.recurring?.interval_count || 1,
      productName: product.name,
      productDescription: product.description,
      active: price.active,
    };

    submitLogEvent('pricing', 'Successfully fetched price details', correlationId, {
      priceId: priceDetails.priceId,
      amount: priceDetails.amount,
      currency: priceDetails.currency,
      interval: priceDetails.interval,
    });

    return priceDetails;
  },
  ['stripe-price-details'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['pricing'],
  },
);

/**
 * GET /api/pricing
 * Get cached pricing information from Stripe
 */
export async function GET(request: NextRequest) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    submitLogEvent('pricing', 'Pricing request received', correlationId);

    const priceDetails = await getCachedPriceDetails(correlationId);

    submitLogEvent('pricing', 'Pricing request completed successfully', correlationId, {
      priceId: priceDetails.priceId,
    });

    return NextResponse.json(priceDetails);
  } catch (error) {
    submitLogEvent('pricing', `Failed to fetch price details: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {
      error: error instanceof Error ? error.stack : undefined,
    }, true);

    return NextResponse.json(
      {
        error: 'Failed to fetch pricing information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
