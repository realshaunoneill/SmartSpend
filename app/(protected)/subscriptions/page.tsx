'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateSubscriptionDialog } from '@/components/subscriptions/create-subscription-dialog';
import { SubscriptionDetailModal } from '@/components/subscriptions/subscription-detail-modal';
import { SubscriptionStats } from '@/components/subscriptions/subscription-stats';
import { SubscriptionList } from '@/components/subscriptions/subscription-list';
import { UpcomingSubscriptionCard } from '@/components/subscriptions/upcoming-subscription-card';
import { Clock, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';

type Status = 'active' | 'paused' | 'cancelled' | undefined;

function SubscriptionsPageContent() {
  const [statusFilter, setStatusFilter] = useState<Status>('active');
  const { data: subscriptions, isLoading } = useSubscriptions(undefined, statusFilter, true);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle selected and filter query parameters from URL
  useEffect(() => {
    const selected = searchParams.get('selected');
    const filter = searchParams.get('filter');
    if (selected) {
      setSelectedSubscriptionId(selected);
    }
    if (filter === 'missing') {
      setShowMissingOnly(true);
    }
  }, [searchParams]);

  // Calculate stats
  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];

  // Get upcoming payments
  const now = new Date();
  const futureDate = addDays(now, 7);

  // Get next 3 upcoming payments (showing all upcoming, highlighting those within 7 days)
  const upcomingPayments = activeSubscriptions
    .filter(sub => sub.nextBillingDate)
    .sort((a, b) => {
      const dateA = new Date(a.nextBillingDate!).getTime();
      const dateB = new Date(b.nextBillingDate!).getTime();
      return dateA - dateB;
    })
    .slice(0, 3); // Top 3 upcoming payments

  // Check how many are within 7 days
  const upcomingWithin7Days = upcomingPayments.filter(sub => {
    const billingDate = new Date(sub.nextBillingDate!);
    return billingDate >= now && billingDate <= futureDate;
  }).length;

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

  // Filter subscriptions with missing payments
  const subscriptionsWithMissing = subscriptions?.filter(sub => (sub.missingPayments || 0) > 0) || [];
  const displaySubscriptions = showMissingOnly ? subscriptionsWithMissing : subscriptions;

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

      {/* Empty State - No Subscriptions */}
      {!isLoading && (!subscriptions || subscriptions.length === 0) && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your recurring payments</p>
          <CreateSubscriptionDialog />
        </div>
      )}

      {/* Stats Grid */}
      {subscriptions && subscriptions.length > 0 && (
        <div className="mb-6">
          <SubscriptionStats
            activeCount={activeSubscriptions.length}
            monthlyTotal={totalMonthly}
            yearlyTotal={totalYearly}
            missingPayments={missingPaymentsCount}
            onMissingPaymentsClick={() => {
              setShowMissingOnly(true);
              setStatusFilter('active');
              const params = new URLSearchParams(searchParams.toString());
              params.set('filter', 'missing');
              router.push(`/subscriptions?${params.toString()}`);
            }}
          />
        </div>
      )}

      {/* Missing Payments Filter Banner */}
      {showMissingOnly && subscriptionsWithMissing.length > 0 && (
        <div className="mb-6 rounded-lg border border-orange-500/50 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Subscriptions Missing Receipts
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {subscriptionsWithMissing.length} subscription{subscriptionsWithMissing.length !== 1 ? 's' : ''} with {missingPaymentsCount} missing payment{missingPaymentsCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMissingOnly(false);
                const params = new URLSearchParams(searchParams.toString());
                params.delete('filter');
                router.push(`/subscriptions${params.toString() ? '?' + params.toString() : ''}`);
              }}
            >
              Show All
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming Payments Section */}
      {subscriptions && subscriptions.length > 0 && upcomingPayments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Upcoming Payments</h2>
            {upcomingWithin7Days > 0 && (
              <span className="text-sm text-muted-foreground">
                • {upcomingWithin7Days} in next 7 days
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingPayments.map((subscription) => (
              <UpcomingSubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onClick={() => setSelectedSubscriptionId(subscription.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {subscriptions && subscriptions.length > 0 && (
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter || 'active'} className="mt-6">
            <SubscriptionList
              subscriptions={displaySubscriptions}
              isLoading={isLoading}
              status={statusFilter || 'active'}
              onSelectSubscription={setSelectedSubscriptionId}
            />
          </TabsContent>
        </Tabs>
      )}

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

