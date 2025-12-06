"use client";

import { Navigation } from "@/components/layout/navigation";
import { SpendingSummaryCard } from "@/components/insights/spending-summary-card";
import { TopItemsList } from "@/components/insights/top-items-list";
import { ItemSearchAnalysis } from "@/components/insights/item-search-analysis";
import { SubscriptionUpsell } from "@/components/subscriptions/subscription-upsell";
import { useUser } from "@/lib/hooks/use-user";
import { Loader2 } from "lucide-react";

export default function InsightsPage() {
  // Get current user data to check subscription
  const { user, isLoading } = useUser();

  const isSubscribed = user?.subscribed === true;

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Spending Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
            AI-powered analysis of your spending patterns and top purchases
          </p>
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
              "AI-powered spending summaries",
              "Top items and purchase trends",
              "Advanced item search and analysis",
              "Custom time period comparisons",
              "Export capabilities"
            ]}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Summary */}
            <div className="lg:col-span-2">
              <SpendingSummaryCard autoLoad />
            </div>

            {/* Top Items */}
            <div className="lg:col-span-2">
              <TopItemsList autoLoad />
            </div>

            {/* Item Search */}
            <div className="lg:col-span-2">
              <ItemSearchAnalysis />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
