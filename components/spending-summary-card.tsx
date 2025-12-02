"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpendingSummary } from "@/hooks/use-spending-summary";
import { Loader2, Sparkles, RefreshCw, TrendingUp, ShoppingBag, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SpendingSummaryCardProps {
  householdId?: string;
  autoLoad?: boolean;
}

export function SpendingSummaryCard({ householdId, autoLoad = false }: SpendingSummaryCardProps) {
  const [months, setMonths] = useState(3);

  const { data: summary, isLoading, error, refetch } = useSpendingSummary({
    householdId,
    months,
    enabled: autoLoad,
  });

  const handleGenerate = () => {
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Spending Insights
            </CardTitle>
            <CardDescription>
              Get personalized insights about your spending patterns
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="text-sm border rounded-md px-2 py-1"
              disabled={isLoading}
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              size="sm"
              variant={summary ? "outline" : "default"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : summary ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm">Analyzing your spending patterns...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            {error.message || "An error occurred"}
          </div>
        )}

        {summary && !isLoading && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{summary.data.statistics.totalItems}</div>
                <div className="text-xs text-muted-foreground mt-1">Items Purchased</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {summary.data.statistics.currency} {summary.data.statistics.totalSpent}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Spent</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">
                  {summary.data.statistics.currency} {summary.data.statistics.averagePerItem.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg per Item</div>
              </div>
            </div>

            <Separator />

            {/* AI Summary */}
            <div className="space-y-4">
              {summary.summary.split('\n\n').map((paragraph, index) => {
                // Check if it's a heading
                if (paragraph.startsWith('###')) {
                  const text = paragraph.replace(/^###\s*/, '').replace(/\*\*/g, '');
                  return (
                    <h3 key={index} className="text-base font-semibold text-foreground mt-4 first:mt-0">
                      {text}
                    </h3>
                  );
                }
                
                // Check if it's a numbered list item
                if (/^\d+\./.test(paragraph)) {
                  const items = paragraph.split('\n').filter(line => /^\d+\./.test(line));
                  return (
                    <ol key={index} className="list-decimal list-inside space-y-2 text-sm">
                      {items.map((item, i) => {
                        const text = item.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');
                        return <li key={i}>{text}</li>;
                      })}
                    </ol>
                  );
                }
                
                // Check if it's a bullet list
                if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
                  const items = paragraph.split('\n').filter(line => line.startsWith('-') || line.startsWith('*'));
                  return (
                    <ul key={index} className="list-disc list-inside space-y-2 text-sm">
                      {items.map((item, i) => {
                        const text = item.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
                        return <li key={i}>{text}</li>;
                      })}
                    </ul>
                  );
                }
                
                // Regular paragraph
                const text = paragraph.replace(/\*\*/g, '');
                return text ? (
                  <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                ) : null;
              })}
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Top Items */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <ShoppingBag className="h-4 w-4" />
                  Top Items
                </div>
                <div className="space-y-2">
                  {summary.data.topItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{item.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {item.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Categories */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <TrendingUp className="h-4 w-4" />
                  Top Categories
                </div>
                <div className="space-y-2">
                  {summary.data.topCategories.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 capitalize">{cat.category}</span>
                      <span className="ml-2 text-muted-foreground">
                        {summary.data.statistics.currency} {cat.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Merchants */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Store className="h-4 w-4" />
                  Top Merchants
                </div>
                <div className="space-y-2">
                  {summary.data.topMerchants.slice(0, 5).map((merchant, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{merchant.merchant}</span>
                      <span className="ml-2 text-muted-foreground">
                        {summary.data.statistics.currency} {merchant.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Token Usage */}
            <div className="text-xs text-muted-foreground text-center pt-2">
              Analysis powered by AI • {summary.usage.totalTokens} tokens used
            </div>
          </div>
        )}

        {!summary && !isLoading && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Click "Generate" to get AI-powered insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
