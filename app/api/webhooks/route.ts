import { headers } from "next/headers";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { syncStripeDataToDatabase } from "@/lib/stripe";
import { CorrelationId } from "@/lib/logging";
import { randomUUID } from "crypto";

// Route configuration - Webhooks need to respond quickly
export const runtime = 'nodejs';
export const maxDuration = 30;

const allowedEvents: Stripe.Event.Type[] = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "customer.subscription.pending_update_applied",
    "customer.subscription.pending_update_expired",
    "customer.subscription.trial_will_end",
    "invoice.paid",
    "invoice.payment_failed",
    "invoice.payment_action_required",
    "invoice.upcoming",
    "invoice.marked_uncollectible",
    "invoice.payment_succeeded",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",

    'charge.refunded',
  ];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("Stripe-Signature");
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  if (!signature) return NextResponse.json({}, { status: 400 });

  async function doEventProcessing() {
    try {
      if (typeof signature !== "string") {
        throw new Error("[STRIPE HOOK] Header isn't a string???");
      }
  
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!  
      );
  
      waitUntil(processEvent(event, correlationId));
    } catch (error) {
      console.error("[STRIPE HOOK] Error processing event", error);
    }
  }

  await doEventProcessing();

  return NextResponse.json({ received: true });
}

async function processEvent(event: Stripe.Event, correlationId: CorrelationId) {
    // Skip processing if the event isn't one I'm tracking (list of all events below)
    if (!allowedEvents.includes(event.type)) {
      if (process.env.NODE_ENV === "development") {
        console.log('Skipping event', event.type);
      }
      return;
    };
  
    // All the events I track have a customerId
    const { customer: customerId } = event?.data?.object as {
      customer: string; // Sadly TypeScript does not know this
    };
  
    // This helps make it typesafe and also lets me know if my assumption is wrong
    if (typeof customerId !== "string") {
      throw new Error(
        `[STRIPE HOOK][CANCER] ID isn't string.\nEvent type: ${event.type}`
      );
    }

    const kvData = await syncStripeDataToDatabase(customerId, correlationId);
  
    return kvData;
  }
