'use client';

import { useState } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { QuickStats } from '@/components/insights/quick-stats';
import { SpendingSummary } from '@/components/insights/spending-summary';
import { SpendingChart } from '@/components/insights/spending-chart';
import { ReceiptList } from '@/components/receipts/receipt-list';
import { HouseholdSelector } from '@/components/households/household-selector';
import { SubscriptionGate } from '@/components/subscriptions/subscription-gate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { useHouseholds } from '@/lib/hooks/use-households';
import { Upload, Receipt, BarChart3, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpcomingPayments } from '@/components/subscriptions/upcoming-payments';
import { useSubscriptions } from '@/hooks/use-subscriptions';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();
  const router = useRouter();

  const { data: households = [] } = useHouseholds();
  const { data: subscriptions = [] } = useSubscriptions(undefined, 'active', false);

  // Determine view mode based on selection
  const isPersonalOnly = selectedHouseholdId === 'personal';
  const actualHouseholdId = isPersonalOnly ? undefined : selectedHouseholdId;

  const { stats, isLoading: statsLoading } = useDashboardStats(actualHouseholdId, isPersonalOnly);

  // Show loading state while stats are loading
  if (statsLoading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:mt-2">Track your spending and manage your receipts</p>
            </div>
          </div>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const quickStats = stats ? {
    totalReceipts: stats.totalReceipts,
    totalTransactions: stats.totalReceipts, // Same as receipts for now
    avgSpending: stats.avgSpending,
    topCategory: stats.topCategory,
  } : {
    totalReceipts: 0,
    totalTransactions: 0,
    avgSpending: 0,
    topCategory: 'No data',
  };

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">Track your spending and manage your receipts</p>
          </div>

          <div className="flex items-center gap-4">
            <HouseholdSelector
              households={[
                { id: '', name: 'All Receipts' },
                { id: 'personal', name: 'Personal Only' },
                ...households,
              ]}
              selectedHouseholdId={selectedHouseholdId || ''}
              onSelect={(id) => setSelectedHouseholdId(id || undefined)}
            />
          </div>
        </div>

        <SubscriptionGate feature="analytics">
          <QuickStats stats={quickStats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <SpendingSummary
              period={period}
              onPeriodChange={setPeriod}
              householdId={actualHouseholdId}
              personalOnly={isPersonalOnly}
            />
            <SpendingChart
              period={period}
              householdId={actualHouseholdId}
              personalOnly={isPersonalOnly}
            />
          </div>
        </SubscriptionGate>

        {subscriptions.length > 0 && (
          <UpcomingPayments subscriptions={subscriptions} daysAhead={7} />
        )}

        {stats?.recentReceipts && stats.recentReceipts.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recent Receipts</h2>
            <ReceiptList receipts={stats.recentReceipts} />
          </div>
        )}

        {(!stats || stats.totalReceipts === 0) && (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Receipt className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to ReceiptWise!</CardTitle>
              <CardDescription className="text-base">
                Start organizing your receipts and tracking your spending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 mb-3">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">1. Upload Receipts</h3>
                  <p className="text-sm text-muted-foreground">
                    Take a photo or upload an image of your receipt
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 mb-3">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">2. AI Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI extracts all the details automatically
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 mb-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">3. Track Spending</h3>
                  <p className="text-sm text-muted-foreground">
                    View insights and analyze your spending patterns
                  </p>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Ready to get started? Upload your first receipt now
                </p>
                <Button onClick={() => router.push('/receipts')} size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your First Receipt
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
