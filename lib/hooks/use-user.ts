'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/nextjs';
import type { User } from '@/lib/db/schema';

type UserResponse = User

/**
 * Fetch current user from API
 */
async function fetchUser(): Promise<UserResponse> {
  const response = await fetch('/api/users/me');
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

/**
 * Update user data
 */
async function updateUser(data: Partial<User>): Promise<UserResponse> {
  const response = await fetch('/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
}

/**
 * Hook to get current user data with subscription status
 */
export function useUser() {
  const { isLoaded: isClerkLoaded, isSignedIn, user: clerkUser } = useClerkUser();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user', clerkUser?.id],
    queryFn: fetchUser,
    enabled: isClerkLoaded && isSignedIn && !!clerkUser,
    retry: 1,
  });

  return {
    user,
    isLoading: !isClerkLoaded || isLoading,
    isSignedIn,
    error,
    refetch,
    isSubscribed: user?.subscribed ?? false,
  };
}

/**
 * Hook to update user data
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      // Update the user query cache
      queryClient.setQueryData(['user', data.clerkId], data);
    },
  });
}
