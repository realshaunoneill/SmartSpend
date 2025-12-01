"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

/**
 * Creates a Stripe customer for a user with comprehensive metadata
 * and updates the database with the customer ID
 */
async function createStripeCustomer(
  userId: string, 
  email: string, 
  clerkId: string
): Promise<string> {
  try {
    // Check if customer already exists in Stripe by email
    const existingCustomer = await stripe.customers.search({
      query: `email:'${email}'`,
    });
    
    if (existingCustomer.data.length > 0) {
      console.log(`Found existing Stripe customer for ${email}`);
      return existingCustomer.data[0].id;
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
    
    console.log(`Created new Stripe customer ${customer.id} for user ${userId}`);
    
    // Update user record with Stripe customer ID
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(users)
      .set({ 
        stripeCustomerId: customer.id,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));

    console.log(`Updated database with Stripe customer ID for user ${userId}`);
    
    return customer.id;
  } catch (error) {
    console.error("Failed to create Stripe customer:", error);
    throw new Error("Failed to create Stripe customer");
  }
}

/**
 * Gets or creates a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  clerkId: string,
  stripeCustomerId?: string | null
): Promise<string> {
  try {
    // If user already has a Stripe customer ID, verify it exists
    if (stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (!customer.deleted) {
          console.log(`Using existing Stripe customer ${stripeCustomerId}`);
          return stripeCustomerId;
        }
      } catch (error) {
        console.log("Existing Stripe customer not found, creating new one");
      }
    }

    // Create customer and update database in one operation
    return await createStripeCustomer(userId, email, clerkId);
  } catch (error) {
    console.error("Error getting or creating Stripe customer:", error);
    throw error;
  }
}

/**
 * Creates a Stripe checkout session for a subscription
 * Automatically handles customer creation if needed
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  clerkId: string,
  priceId: string,
  stripeCustomerId?: string | null,
  successUrl?: string,
  cancelUrl?: string
) {
  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      email,
      clerkId,
      stripeCustomerId
    );

    // Create checkout session with the customer
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        clerkId: clerkId,
        email: email,
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

/**
 * Syncs Stripe subscription data to the database for a customer
 * Updates the user's subscription status based on their active Stripe subscription
 */
export async function syncStripeDataToDatabase(customerId: string) {
  try {
    // Verify customer exists in Stripe
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      throw new Error("Customer not found in Stripe");
    }

    // Get user from database by Stripe customer ID
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      throw new Error(`User not found for Stripe customer ${customerId}`);
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    // No active subscriptions
    if (subscriptions.data.length === 0) {
      // Update user to not subscribed
      await db
        .update(users)
        .set({ 
          subscribed: false,
          updatedAt: new Date() 
        })
        .where(eq(users.id, user.id));

      console.log(`Updated user ${user.id} subscription status to false (no subscriptions)`);

      const subData = { status: "none" };
      return subData;
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];

    // Determine if user should be considered subscribed
    // Active statuses: active, trialing
    const isSubscribed = subscription.status === "active" || subscription.status === "trialing";

    // Update user subscription status in database
    await db
      .update(users)
      .set({ 
        subscribed: isSubscribed,
        updatedAt: new Date() 
      })
      .where(eq(users.id, user.id));

    console.log(`Updated user ${user.id} subscription status to ${isSubscribed} (${subscription.status})`);

    // Store complete subscription state
    const subData = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: (subscription as any).current_period_end,
      currentPeriodStart: (subscription as any).current_period_start,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod:
        subscription.default_payment_method &&
        typeof subscription.default_payment_method !== "string"
          ? {
              brand: subscription.default_payment_method.card?.brand ?? null,
              last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : null,
    };

    return subData;
  } catch (error) {
    console.error("Error syncing Stripe data to database:", error);
    throw error;
  }
}