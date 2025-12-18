'use server';
import { Suspense } from 'react';
import { randomUUID } from 'crypto';
import { syncStripeDataToDatabase } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import Stripe from 'stripe';
import SuccessContent from './content';
import { Skeleton } from '@/components/ui/skeleton';
import { type CorrelationId } from '@/lib/logging';
import { redirect } from 'next/navigation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function Success({ searchParams }: SuccessPageProps) {
  const correlationId = randomUUID() as CorrelationId;
  const params = await searchParams;
  const sessionId = params.session_id;

  // Check authentication
  const authResult = await getAuthenticatedUser(correlationId);
  if (authResult instanceof Response) {
    redirect('/sign-in');
  }
  const { user } = authResult;

  let subscriptionData;
  let session;
  if (sessionId) {
    // Retrieve the session
    session = await stripe.checkout.sessions.retrieve(sessionId);

    // Get the customer ID from the session
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    if (customerId) {
      // Sync Stripe data to database when the page loads
      subscriptionData = await syncStripeDataToDatabase(customerId, correlationId);
    }
  }

  return (
    <>
      <Suspense
        fallback={
          <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
            <div className="space-y-6 max-w-md w-full">
              {/* Animated checkmark circle */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Loading text */}
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>

              {/* Payment details skeleton */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <SuccessContent
          sessionId={sessionId}
          _subscriptionStatus={subscriptionData?.status}
          userName={user.email}
        />
      </Suspense>
    </>
  );
}
