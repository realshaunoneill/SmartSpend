'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateSubscriptionDialog } from '@/components/subscriptions/create-subscription-dialog';
import { SubscriptionDetailModal } from '@/components/subscriptions/subscription-detail-modal';
import { SubscriptionStats } from '@/components/subscriptions/subscription-stats';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { NextSubscriptionCard } from '@/components/subscriptions/next-subscription-card';
import { Loader2 } from 'lucide-react';

type Status = 'active' | 'paused' | 'cancelled' | undefined;

function SubscriptionsPageContent() {
  const [statusFilter, setStatusFilter] = useState<Status>('active');
  const { data: subscriptions, isLoading } = useSubscriptions(undefined, statusFilter, true);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Handle selected query parameter from URL
  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected) {
      setSelectedSubscriptionId(selected);
    }
  }, [searchParams]);

  // Calculate stats
  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];

  // Find next upcoming subscription
  const nextSubscription = activeSubscriptions
    .filter(s => s.nextBillingDate)
    .sort((a, b) => {
      const dateA = new Date(a.nextBillingDate!).getTime();
      const dateB = new Date(b.nextBillingDate!).getTime();
      return dateA - dateB;
    })[0];

  const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
    const amount = parseFloat(sub.amount);
    if (sub.billingFrequency === 'monthly') return sum + amount;
    if (sub.billingFrequency === 'quarterly') return sum + (amount / 3);
    if (sub.billingFrequency === 'yearly') return sum + (amount / 12);
    if (sub.billingFrequency === 'custom' && sub.customFrequencyDays) {
      return sum + (amount / sub.customFrequencyDays * 30);
    }
    return sum;
  }, 0);

  const totalYearly = totalMonthly * 12;
  const missingPaymentsCount = subscriptions?.reduce((sum, sub) => sum + (sub.missingPayments || 0), 0) || 0;

  return (
    <>
      <Navigation />
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Track and manage your recurring expenses</p>
        </div>
        <CreateSubscriptionDialog />
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <SubscriptionStats
          activeCount={activeSubscriptions.length}
          monthlyTotal={totalMonthly}
          yearlyTotal={totalYearly}
          missingPayments={missingPaymentsCount}
        />
      </div>

      {/* Next Upcoming Subscription */}
      {nextSubscription && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Next Payment Due</h2>
          <NextSubscriptionCard
            subscription={nextSubscription}
            onClick={() => setSelectedSubscriptionId(nextSubscription.id)}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter || 'active'} className="mt-6">
          <SubscriptionList
            subscriptions={subscriptions}
            isLoading={isLoading}
            status={statusFilter || 'active'}
            onSelectSubscription={setSelectedSubscriptionId}
          />
        </TabsContent>
      </Tabs>

        {/* Detail Modal */}
        <SubscriptionDetailModal
          subscriptionId={selectedSubscriptionId}
          open={!!selectedSubscriptionId}
          onOpenChange={(open) => !open && setSelectedSubscriptionId(null)}
        />
      </div>
    </>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SubscriptionsPageContent />
    </Suspense>
  );
}

