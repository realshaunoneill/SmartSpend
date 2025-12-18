'use client';

import type React from 'react';
import { useUser } from '@clerk/nextjs';
import { useUser as useUserData } from '@/lib/hooks/use-user';
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';
import { Loader2 } from 'lucide-react';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
      {children}
      <OnboardingTour
        open={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    </>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { isLoading: userDataLoading } = useUserData();

  // Show loading state while authentication is being checked
  if (!clerkLoaded || userDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User not signed in (will be redirected by middleware, but show loading)
  if (!isSignedIn) {
    return null;
  }

  return (
    <OnboardingProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </OnboardingProvider>
  );
}
