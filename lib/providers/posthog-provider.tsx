'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

// Check if PostHog is initialized (has a valid key)
const isPostHogEnabled = !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    // Skip PostHog calls if not enabled
    if (!isPostHogEnabled) return;

    if (isSignedIn && user) {
      // Identify the user in PostHog
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
      });
    } else if (!isSignedIn) {
      // Reset PostHog when user signs out
      posthog.reset();
    }
  }, [isSignedIn, user]);

  return <>{children}</>;
}
