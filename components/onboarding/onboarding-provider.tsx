'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type OnboardingContextType = {
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;
  isLoading: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
};

type OnboardingStatus = {
  completed: boolean;
  completedAt: string | null;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Fetch onboarding status from API
 */
async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await fetch('/api/users/onboarding');
  if (!response.ok) {
    throw new Error('Failed to fetch onboarding status');
  }
  return response.json();
}

/**
 * Mark onboarding as complete
 */
async function markOnboardingComplete(): Promise<{ success: boolean }> {
  const response = await fetch('/api/users/onboarding', {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to mark onboarding complete');
  }
  return response.json();
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient = useQueryClient();

  // Fetch onboarding status with React Query
  const { data, isLoading, error } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status'],
    queryFn: fetchOnboardingStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show onboarding for new users when data loads
  useEffect(() => {
    if (data && !data.completed) {
      setShowOnboarding(true);
    }
  }, [data]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('Error checking onboarding status:', error);
    }
  }, [error]);

  // Mutation to mark onboarding as complete
  const completeMutation = useMutation({
    mutationFn: markOnboardingComplete,
    onSuccess: () => {
      // Update the cache
      queryClient.setQueryData<OnboardingStatus>(['onboarding-status'], {
        completed: true,
        completedAt: new Date().toISOString(),
      });
      setShowOnboarding(false);
    },
    onError: (error) => {
      console.error('Error completing onboarding:', error);
      // Still close the dialog even if API fails
      setShowOnboarding(false);
    },
  });

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = async () => {
    await completeMutation.mutateAsync();
  };

  const skipOnboarding = async () => {
    await completeMutation.mutateAsync();
  };

  const hasCompletedOnboarding = data?.completed ?? true;

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        showOnboarding,
        isLoading,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
