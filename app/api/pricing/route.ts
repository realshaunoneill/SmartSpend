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

// Cached function to fetch price details for both monthly and annual plans
const getCachedPriceDetails = unstable_cache(
  async (correlationId: CorrelationId) => {
    const monthlyPriceId = process.env.STRIPE_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    if (!monthlyPriceId) {
      submitLogEvent('pricing', 'Monthly price ID not configured', correlationId, {}, true);
      throw new Error('Monthly price ID not configured');
    }

    submitLogEvent('pricing', 'Fetching price details from Stripe', correlationId, { monthlyPriceId, annualPriceId });

    // Fetch monthly price
    const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId, {
      expand: ['product'],
    });

    if (!monthlyPrice.active) {
      submitLogEvent('pricing', 'Monthly price is not active', correlationId, { monthlyPriceId, active: monthlyPrice.active }, true);
      throw new Error('This subscription plan is not available');
    }

    const product = monthlyPrice.product as Stripe.Product;

    const monthlyDetails = {
      priceId: monthlyPrice.id,
      amount: monthlyPrice.unit_amount || 0,
      currency: monthlyPrice.currency,
      interval: monthlyPrice.recurring?.interval || 'month',
      intervalCount: monthlyPrice.recurring?.interval_count || 1,
      productName: product.name,
      productDescription: product.description,
      active: monthlyPrice.active,
    };

    // Fetch annual price if configured
    let annualDetails = null;
    if (annualPriceId) {
      try {
        const annualPrice = await stripe.prices.retrieve(annualPriceId, {
          expand: ['product'],
        });

        if (annualPrice.active) {
          annualDetails = {
            priceId: annualPrice.id,
            amount: annualPrice.unit_amount || 0,
            currency: annualPrice.currency,
            interval: annualPrice.recurring?.interval || 'year',
            intervalCount: annualPrice.recurring?.interval_count || 1,
            productName: (annualPrice.product as Stripe.Product).name,
            productDescription: (annualPrice.product as Stripe.Product).description,
            active: annualPrice.active,
          };
        }
      } catch (error) {
        submitLogEvent('pricing', `Failed to fetch annual price: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { annualPriceId }, false);
      }
    }

    submitLogEvent('pricing', 'Successfully fetched price details', correlationId, {
      monthlyPriceId: monthlyDetails.priceId,
      monthlyAmount: monthlyDetails.amount,
      annualPriceId: annualDetails?.priceId,
      annualAmount: annualDetails?.amount,
    });

    return {
      monthly: monthlyDetails,
      annual: annualDetails,
    };
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
      monthlyPriceId: priceDetails.monthly.priceId,
      hasAnnual: !!priceDetails.annual,
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
