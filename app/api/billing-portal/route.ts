import { type NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession, findAndReassociateStripeCustomer } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';

export async function POST(_request: NextRequest) {
  const correlationId = crypto.randomUUID() as CorrelationId;

  try {
    const result = await getAuthenticatedUser();

    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    const { user } = result;

    let stripeCustomerId = user.stripeCustomerId;

    // If no Stripe customer ID is set, try to find and re-associate it
    if (!stripeCustomerId) {
      submitLogEvent('billing-portal', `No Stripe customer ID found for user ${user.id}, attempting to find and re-associate`, correlationId, { userId: user.id, email: user.email });

      stripeCustomerId = await findAndReassociateStripeCustomer(user.id, user.email, correlationId);

      if (!stripeCustomerId) {
        return NextResponse.json(
          { error: 'No Stripe customer ID found. Please subscribe first.' },
          { status: 400 },
        );
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.receiptwise.io';
    const returnUrl = `${appUrl}/payment/successful`;
    const portalUrl = await createBillingPortalSession(
      stripeCustomerId,
      returnUrl,
      correlationId,
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 },
    );
  }
}
