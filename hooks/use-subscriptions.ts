import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Subscription, type SubscriptionPayment } from '@/lib/db/schema';

type SubscriptionWithPayments = Subscription & {
  missingPayments?: number;
  recentPayments?: SubscriptionPayment[];
};

type SubscriptionDetail = Subscription & {
  payments: SubscriptionPayment[];
};

type CreateSubscriptionData = {
  name: string;
  description?: string;
  category?: string;
  amount: number;
  currency?: string;
  billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  billingDay: number;
  customFrequencyDays?: number;
  startDate: Date;
  householdId?: string;
  isBusinessExpense?: boolean;
  website?: string;
  notes?: string;
};

type UpdateSubscriptionData = Partial<{
  name: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  billingDay: number;
  customFrequencyDays: number;
  status: 'active' | 'paused' | 'cancelled';
  endDate: Date | null;
  isBusinessExpense: boolean;
  website: string;
  notes: string;
}>;

type UpdatePaymentData = {
  receiptId?: string;
  status?: 'pending' | 'paid' | 'missed' | 'cancelled';
  actualDate?: Date;
  actualAmount?: number;
  notes?: string;
};

// Fetch all subscriptions
export function useSubscriptions(
  householdId?: string,
  status?: string,
  includePayments = false,
) {
  return useQuery<SubscriptionWithPayments[]>({
    queryKey: ['subscriptions', householdId, status, includePayments],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (householdId) params.append('householdId', householdId);
      if (status) params.append('status', status);
      if (includePayments) params.append('includePayments', 'true');

      const res = await fetch(`/api/subscriptions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - subscriptions don't change frequently
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });
}

// Fetch single subscription with payment history
export function useSubscription(id: string) {
  return useQuery<SubscriptionDetail>({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionData) => {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create subscription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Update subscription
export function useUpdateSubscription(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionData) => {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update subscription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    },
  });
}

// Delete subscription
export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete subscription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Update payment (link receipt or change status)
export function useUpdatePayment(subscriptionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, data }: { paymentId: string; data: UpdatePaymentData }) => {
      const res = await fetch(`/api/subscriptions/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      if (subscriptionId) {
        queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      }
    },
  });
}

// Unlink receipt from payment
export function useUnlinkPayment(subscriptionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch(`/api/subscriptions/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to unlink payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      if (subscriptionId) {
        queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      }
    },
  });
}
