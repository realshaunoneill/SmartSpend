'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

/**
 * Smart redirect page that sends users to the appropriate destination based on their subscription
 * - New/Free users (not subscribed): /upgrade (to see premium benefits)
 * - Premium users (subscribed): /dashboard (to start using the app)
 */
export default function RedirectPage() {
  const router = useRouter();
  const { user, isLoading: userLoading, isSubscribed } = useUser();
  const { isLoaded: clerkLoaded } = useClerkUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Prevent double redirects
    if (hasRedirected) {
      return;
    }

    // Wait for both Clerk and user data to load
    if (!clerkLoaded || userLoading) {
      return;
    }

    // Only redirect when we have valid user data
    if (user) {
      setHasRedirected(true);

      if (!isSubscribed) {
        // Free user - send to upgrade page to see premium benefits
        router.replace('/upgrade');
      } else {
        // Premium user - send to dashboard to start using the app
        router.replace('/dashboard');
      }
    }
  }, [user, userLoading, clerkLoaded, isSubscribed, router, hasRedirected]);

  // Timeout fallback: if loading takes more than 10 seconds, redirect to dashboard
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasRedirected && clerkLoaded) {
        setHasRedirected(true);
        // Default to dashboard if we can't determine subscription status
        router.replace('/dashboard');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [hasRedirected, clerkLoaded, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Setting up your experience...</p>
      </div>
    </div>
  );
}
