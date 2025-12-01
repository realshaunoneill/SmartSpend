import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@/lib/stripe";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/checkout
 * Create a Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Clerk user email
    const email = await getClerkUserEmail(clerkId);
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email);

    // Get the price ID from request body (optional - you can hardcode if there's only one plan)
    const body = await request.json();
    const priceId = body.priceId || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 400 }
      );
    }

    // Verify the price exists and is active
    try {
      const price = await stripe.prices.retrieve(priceId, {
        expand: ["product"],
      });

      if (!price.active) {
        return NextResponse.json(
          { error: "This subscription plan is not available" },
          { status: 400 }
        );
      }

      console.log(
        `Creating checkout session for price: ${(price.product as Stripe.Product).name}`
      );
    } catch (error) {
      console.error("Error retrieving price:", error);
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      );
    }

    // Create checkout session (handles customer creation automatically)
    const checkoutSession = await createCheckoutSession(
      user.id,
      email,
      clerkId,
      priceId,
      user.stripeCustomerId,
      body.successUrl,
      body.cancelUrl
    );

    if (!checkoutSession || !checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    console.log("Checkout session created:", {
      sessionId: checkoutSession.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
