"use client";

import { Navigation } from "@/components/layout/navigation";
import { SpendingSummaryCard } from "@/components/insights/spending-summary-card";
import { TopItemsList } from "@/components/insights/top-items-list";
import { ItemSearchAnalysis } from "@/components/insights/item-search-analysis";

export default function InsightsPage() {
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
      </main>
    </>
  );
}
