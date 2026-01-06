'use client';

import type React from 'react';
import { useUser } from '@clerk/nextjs';
import { useUser as useUserData } from '@/lib/hooks/use-user';
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';
import { Loader2, ShieldX, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/nextjs';

function BlockedUserPage({ reason }: { reason?: string }) {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Account Suspended</h1>
        <p className="text-muted-foreground mb-4">
          Your account has been suspended and you cannot access the application.
        </p>
        {reason && (
          <div className="mb-6 rounded-lg bg-muted p-4 text-left">
            <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          If you believe this is a mistake, please contact our support team.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <a href="mailto:support@receiptwise.app">
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </a>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const { isLoading: userDataLoading, isBlocked, blockedReason } = useUserData();

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

  // Show blocked user page if account is suspended
  if (isBlocked) {
    return <BlockedUserPage reason={blockedReason} />;
  }

  return (
    <OnboardingProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </OnboardingProvider>
  );
}
