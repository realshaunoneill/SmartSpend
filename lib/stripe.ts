'use server';

import Stripe from 'stripe';
import { UserService } from './services/user-service';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

/**
 * Creates a Stripe customer for a user with comprehensive metadata
 * and updates the database with the customer ID
 */
async function createStripeCustomer(
  userId: string,
  email: string,
  clerkId: string,
  correlationId: CorrelationId,
): Promise<string> {
  try {
    const { UserService } = await import('@/lib/services/user-service');

    // Check if customer already exists in Stripe by email
    const existingCustomer = await stripe.customers.search({
      query: `email:'${email}'`,
    });

    if (existingCustomer.data.length > 0) {
      const customerId = existingCustomer.data[0].id;
      submitLogEvent('stripe', `Found existing Stripe customer ${customerId} for ${email}`, correlationId, { userId, customerId, email });

      // Update user record with the existing Stripe customer ID
      // This ensures the database stays in sync even if the customer was created elsewhere
      await UserService.updateStripeCustomerId(userId, customerId);

      submitLogEvent('stripe', `Updated database with existing Stripe customer ID for user ${userId}`, correlationId, { userId, customerId });

      return customerId;
    }

    // Create new Stripe customer with comprehensive metadata
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        userId: userId,
        clerkId: clerkId,
        email: email,
      },
    });

    submitLogEvent('stripe', `Created new Stripe customer ${customer.id} for user ${userId}`, correlationId, { userId, customerId: customer.id, email });

    // Update user record with Stripe customer ID
    await UserService.updateStripeCustomerId(userId, customer.id);

    submitLogEvent('stripe', `Updated database with Stripe customer ID for user ${userId}`, correlationId, { userId, customerId: customer.id });

    return customer.id;
  } catch (error) {
    submitLogEvent('stripe', `Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { userId, email }, true);
    throw new Error('Failed to create Stripe customer');
  }
}

/**
 * Gets or creates a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  clerkId: string,
  stripeCustomerId: string | null | undefined,
  correlationId: CorrelationId,
): Promise<string> {
  try {
    // If user already has a Stripe customer ID, verify it exists
    if (stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (!customer.deleted) {
          submitLogEvent('stripe', `Using existing Stripe customer ${stripeCustomerId}`, correlationId, { userId, customerId: stripeCustomerId });
          return stripeCustomerId;
        }
      } catch (_error) {
        submitLogEvent('stripe', 'Existing Stripe customer not found, creating new one', correlationId, { userId, stripeCustomerId });
      }
    }

    // Create customer and update database in one operation
    return await createStripeCustomer(userId, email, clerkId, correlationId);
  } catch (error) {
    submitLogEvent('stripe', `Error getting or creating Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { userId, email }, true);
    throw error;
  }
}

/**
 * Creates a Stripe checkout session for a subscription
 * Automatically handles customer creation if needed
 * Supports free trial based on NEXT_PUBLIC_STRIPE_TRIAL_DAYS environment variable
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  clerkId: string,
  priceId: string,
  stripeCustomerId: string | null | undefined,
  successUrl: string | undefined,
  cancelUrl: string | undefined,
  correlationId: CorrelationId,
) {
  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      email,
      clerkId,
      stripeCustomerId,
      correlationId,
    );

    // Parse trial days from environment variable
    const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS
      ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS, 10)
      : 0;

    const hasValidTrial = trialDays > 0 && !isNaN(trialDays);

    if (hasValidTrial) {
      submitLogEvent('checkout', `Creating checkout session with ${trialDays} day free trial`, correlationId, {
        userId,
        priceId,
        trialDays,
      });
    }

    // Calculate trial end timestamp (current time + trial days + 5 minutes buffer)
    // The 5 minute buffer gives users time to complete the checkout process
    const trialEnd = hasValidTrial
      ? Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60) + (5 * 60)
      : undefined;

    // Create checkout session with the customer
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      // Add subscription data with trial period if configured
      ...(hasValidTrial && {
        subscription_data: {
          trial_end: trialEnd,
          metadata: {
            trial_days: trialDays.toString(),
          },
        },
      }),
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/successful?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        clerkId: clerkId,
        email: email,
        ...(hasValidTrial && { trial_days: trialDays.toString() }),
      },
    });

    return session;
  } catch (error) {
    submitLogEvent('checkout', `Error creating checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { userId, priceId }, true);
    throw error;
  }
}

/**
 * Syncs Stripe subscription data to the database for a customer
 * Updates the user's subscription status based on their active Stripe subscription
 */
export async function syncStripeDataToDatabase(customerId: string, correlationId: CorrelationId) {
  try {
    // Verify customer exists in Stripe
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      throw new Error('Customer not found in Stripe');
    }

    // Get user from database by Stripe customer ID
    const user = await UserService.getUserByStripeCustomerId(customerId);

    if (!user) {
      throw new Error(`User not found for Stripe customer ${customerId}`);
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // No active subscriptions
    if (subscriptions.data.length === 0) {
      // Update user to not subscribed
      await UserService.updateSubscriptionStatus(user.id, false);

      submitLogEvent('subscription', `Updated user ${user.id} subscription status to false (no subscriptions)`, correlationId, { userId: user.id, customerId });

      const subData = { status: 'none' };
      return subData;
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];

    // Determine if user should be considered subscribed
    // Active statuses: active, trialing
    const isSubscribed = subscription.status === 'active' || subscription.status === 'trialing';

    // Update user subscription status in database
    await UserService.updateSubscriptionStatus(user.id, isSubscribed);

    submitLogEvent('subscription', `Updated user ${user.id} subscription status to ${isSubscribed} (${subscription.status})`, correlationId, { userId: user.id, customerId, subscriptionStatus: subscription.status, isSubscribed });

    // Store complete subscription state
    const subData = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: 'current_period_end' in subscription ? (subscription.current_period_end as number) : 0,
      currentPeriodStart: 'current_period_start' in subscription ? (subscription.current_period_start as number) : 0,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod:
        subscription.default_payment_method &&
        typeof subscription.default_payment_method !== 'string'
          ? {
              brand: subscription.default_payment_method.card?.brand ?? null,
              last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : null,
    };

    return subData;
  } catch (error) {
    submitLogEvent('stripe', `Error syncing Stripe data to database: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { customerId }, true);
    throw error;
  }
}

/**
 * Creates a Stripe billing portal session for a customer to manage their subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
  correlationId: CorrelationId,
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    submitLogEvent('stripe', `Created billing portal session for customer ${customerId}`, correlationId, { customerId });

    return session.url;
  } catch (error) {
    submitLogEvent('stripe', `Error creating billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { customerId }, true);
    throw error;
  }
}
