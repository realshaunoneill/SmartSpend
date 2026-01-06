import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  subscribed: boolean;
  isAdmin: boolean;
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string | null;
  createdAt: string;
  stripeCustomerId: string | null;
  receiptCount?: number;
  householdCount?: number;
}

interface UpdateUserParams {
  userId: string;
  subscribed?: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
}

interface UpdateUserResponse {
  success: boolean;
  user: AdminUser;
}

async function updateUser(params: UpdateUserParams): Promise<UpdateUserResponse> {
  const { userId, ...data } = params;
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update user');
  }

  return response.json();
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data, variables) => {
      // Invalidate admin users query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

      // Show success message based on what was updated
      if (variables.subscribed !== undefined) {
        toast.success(
          variables.subscribed
            ? `${data.user.email} is now subscribed`
            : `${data.user.email} subscription removed`,
        );
      }
      if (variables.isBlocked !== undefined) {
        toast.success(
          variables.isBlocked
            ? `${data.user.email} has been blocked`
            : `${data.user.email} has been unblocked`,
        );
      }
      if (variables.blockedReason !== undefined && variables.isBlocked === undefined) {
        toast.success(`Block reason updated for ${data.user.email}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBlockUser() {
  const updateUser = useUpdateUser();

  return {
    ...updateUser,
    mutate: (userId: string, reason?: string) => {
      updateUser.mutate({ userId, isBlocked: true, blockedReason: reason });
    },
    mutateAsync: async (userId: string, reason?: string) => {
      return updateUser.mutateAsync({ userId, isBlocked: true, blockedReason: reason });
    },
  };
}

export function useUnblockUser() {
  const updateUser = useUpdateUser();

  return {
    ...updateUser,
    mutate: (userId: string) => {
      updateUser.mutate({ userId, isBlocked: false });
    },
    mutateAsync: async (userId: string) => {
      return updateUser.mutateAsync({ userId, isBlocked: false });
    },
  };
}

export function useToggleSubscription() {
  const updateUser = useUpdateUser();

  return {
    ...updateUser,
    mutate: (userId: string, subscribed: boolean) => {
      updateUser.mutate({ userId, subscribed });
    },
    mutateAsync: async (userId: string, subscribed: boolean) => {
      return updateUser.mutateAsync({ userId, subscribed });
    },
  };
}
