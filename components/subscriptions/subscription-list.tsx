'use client';

import { SubscriptionCard } from './subscription-card';
import { SubscriptionListSkeleton } from './subscription-list-skeleton';
import { SubscriptionEmptyState } from './subscription-empty-state';
import { type Subscription, type SubscriptionPayment } from '@/lib/db/schema';

type SubscriptionWithPayments = Subscription & {
  missingPayments?: number;
  recentPayments?: SubscriptionPayment[];
};

type SubscriptionListProps = {
  subscriptions?: SubscriptionWithPayments[];
  isLoading: boolean;
  status: string;
  onSelectSubscription: (id: string) => void;
};

export function SubscriptionList({
  subscriptions,
  isLoading,
  status,
  onSelectSubscription,
}: SubscriptionListProps) {
  if (isLoading) {
    return <SubscriptionListSkeleton />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return <SubscriptionEmptyState status={status} />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {subscriptions.map((subscription) => (
        <SubscriptionCard
          key={subscription.id}
          subscription={subscription}
          onClick={() => onSelectSubscription(subscription.id)}
        />
      ))}
    </div>
  );
}
