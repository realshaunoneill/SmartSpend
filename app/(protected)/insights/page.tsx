'use client';

import { useState } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { SpendingSummaryCard } from '@/components/insights/spending-summary-card';
import { TopItemsList } from '@/components/insights/top-items-list';
import { ItemSearchAnalysis } from '@/components/insights/item-search-analysis';
import { SubscriptionInsights } from '@/components/insights/subscription-insights';
import { SubscriptionUpsell } from '@/components/subscriptions/subscription-upsell';
import { HouseholdSelector } from '@/components/households/household-selector';
import { useUser } from '@/lib/hooks/use-user';
import { useHouseholds } from '@/lib/hooks/use-households';
import { Loader2, Sparkles, TrendingUp, Search, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsightsPage() {
  const { user, isLoading } = useUser();
  const { data: households = [] } = useHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();
  const [activeTab, setActiveTab] = useState('overview');

  const isSubscribed = user?.subscribed === true;

  // Determine view mode based on selection
  const isPersonalOnly = selectedHouseholdId === 'personal';
  const actualHouseholdId = isPersonalOnly ? undefined : selectedHouseholdId;

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Spending Insights
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
              AI-powered analysis of your spending patterns and top purchases
            </p>
          </div>

          {isSubscribed && (
            <HouseholdSelector
              households={[
                { id: '', name: 'All Receipts' },
                { id: 'personal', name: 'Personal Only' },
                ...households,
              ]}
              selectedHouseholdId={selectedHouseholdId || ''}
              onSelect={(id) => setSelectedHouseholdId(id || undefined)}
            />
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isSubscribed ? (
          <SubscriptionUpsell
            title="Premium Insights Locked"
            description="Upgrade to Premium to unlock powerful spending insights:"
            features={[
              'AI-powered spending summaries',
              'Top items and purchase trends',
              'Advanced item search and analysis',
              'Subscription cost overview',
              'Household expense filtering',
            ]}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="h-4 w-4 hidden sm:block" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="ai-summary" className="gap-2">
                <Sparkles className="h-4 w-4 hidden sm:block" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger value="top-items" className="gap-2">
                <Search className="h-4 w-4 hidden sm:block" />
                Top Items
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="gap-2">
                <CreditCard className="h-4 w-4 hidden sm:block" />
                Subscriptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <SubscriptionInsights />
              <div className="grid gap-6 lg:grid-cols-2">
                <SpendingSummaryCard householdId={actualHouseholdId} autoLoad />
                <TopItemsList householdId={actualHouseholdId} autoLoad />
              </div>
            </TabsContent>

            <TabsContent value="ai-summary" className="space-y-6 mt-6">
              <SpendingSummaryCard householdId={actualHouseholdId} autoLoad />
              <ItemSearchAnalysis householdId={actualHouseholdId} />
            </TabsContent>

            <TabsContent value="top-items" className="space-y-6 mt-6">
              <TopItemsList householdId={actualHouseholdId} autoLoad />
              <ItemSearchAnalysis householdId={actualHouseholdId} />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6 mt-6">
              <SubscriptionInsights />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  );
}
