import { NextRequest, NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { CorrelationId } from "@/lib/logging";

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID() as CorrelationId;

  try {
    const result = await getAuthenticatedUser();
    
    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    const { user } = result;

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer ID found. Please subscribe first." },
        { status: 400 }
      );
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;
    const portalUrl = await createBillingPortalSession(
      user.stripeCustomerId,
      returnUrl,
      correlationId
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
