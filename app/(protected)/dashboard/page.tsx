'use client';

import { useState } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { QuickStats } from '@/components/insights/quick-stats';
import { SpendingSummary } from '@/components/insights/spending-summary';
import { SpendingChart } from '@/components/insights/spending-chart';
import { ReceiptList } from '@/components/receipts/receipt-list';
import { HouseholdSelector } from '@/components/households/household-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';
import { useHouseholds } from '@/lib/hooks/use-households';
import { useUser } from '@/lib/hooks/use-user';
import { Upload, Receipt, BarChart3, ArrowRight, Loader2, Sparkles, PieChart, Crown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpcomingPayments } from '@/components/subscriptions/upcoming-payments';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();
  const router = useRouter();

  const { data: households = [] } = useHouseholds();
  const { data: subscriptions = [] } = useSubscriptions(undefined, 'active', false);
  const { isSubscribed } = useUser();

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

        {/* Quick Stats - show for subscribed users with receipts */}
        {isSubscribed && stats && stats.totalReceipts > 0 && (
          <>
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

            {/* Category Breakdown */}
            {stats?.spendingByCategory && stats.spendingByCategory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Spending by Category</CardTitle>
                    </div>
                    <Link href="/insights">
                      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        View AI Insights
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.spendingByCategory.slice(0, 6).map((category) => (
                      <div
                        key={category.category}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {category.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{category.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

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
              <CardTitle className="text-2xl text-foreground">Welcome to ReceiptWise!</CardTitle>
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

              {/* Premium Upsell for non-subscribed users */}
              {!isSubscribed && (
                <div className="rounded-lg border border-primary/20 bg-linear-to-br from-primary/5 via-transparent to-primary/5 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">Upgrade to Premium</h3>
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Unlock the full power of ReceiptWise with AI-powered features
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          Unlimited uploads
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          AI insights
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          Household sharing
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => router.push('/upgrade')} className="shrink-0 gap-2">
                      <Sparkles className="h-4 w-4" />
                      Learn More
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center pt-4 border-t">
                {isSubscribed ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ready to get started? Upload your first receipt now
                    </p>
                    <Button onClick={() => router.push('/receipts')} size="lg" className="gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Your First Receipt
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upgrade to Premium to start uploading and tracking your receipts
                    </p>
                    <Button onClick={() => router.push('/upgrade')} size="lg" className="gap-2">
                      <Crown className="h-5 w-5" />
                      Upgrade to Premium
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
