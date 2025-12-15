'use client';

import { useUser } from '@clerk/nextjs';
import { useUser as useUserData } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthenticatedPageProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  redirectTo?: string;
}

export function AuthenticatedPage({
  children,
  requireSubscription = false,
  redirectTo = '/sign-in',
}: AuthenticatedPageProps) {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { user: userData, isLoading: userDataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    if (clerkLoaded && !isSignedIn) {
      router.push(redirectTo);
    }
  }, [clerkLoaded, isSignedIn, router, redirectTo]);

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

  // User not signed in (will be redirected)
  if (!isSignedIn || !clerkUser) {
    return null;
  }

  // Check subscription requirement
  if (requireSubscription && !userData?.subscribed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
