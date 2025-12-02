"use client";

import { Navigation } from "@/components/navigation";
import { SpendingSummaryCard } from "@/components/spending-summary-card";
import { TopItemsList } from "@/components/top-items-list";
import { ItemSearchAnalysis } from "@/components/item-search-analysis";

export default function InsightsPage() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Spending Insights
          </h1>
          <p className="mt-2 text-muted-foreground">
            AI-powered analysis of your spending patterns and top purchases
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
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
