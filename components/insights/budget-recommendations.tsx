'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/lib/hooks/use-currency';
import {
  Target,
  TrendingDown,
  Sparkles,
  RefreshCcw,
  Loader2,
  AlertCircle,
  PiggyBank,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BudgetRecommendation } from '@/lib/openai';

interface BudgetRecommendationsProps {
  householdId?: string;
}

interface BudgetResponse {
  recommendation: BudgetRecommendation | null;
  data?: {
    totalSpent: number;
    avgMonthly: number;
    currency: string;
    months: number;
    receiptCount: number;
  };
  message?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export function BudgetRecommendations({ householdId }: BudgetRecommendationsProps) {
  const [months, setMonths] = useState(3);
  const [expandedCategories, setExpandedCategories] = useState(false);
  const { format: formatCurrency } = useCurrency();

  const { data, isLoading, error, refetch, isFetching } = useQuery<BudgetResponse>({
    queryKey: ['budget-recommendations', householdId, months],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('months', months.toString());
      if (householdId) params.set('householdId', householdId);

      const res = await fetch(`/api/receipts/budget-recommendations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch budget recommendations');
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const priorityColors = {
    essential: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    important: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    discretionary: 'bg-green-500/10 text-green-700 dark:text-green-400',
  };

  const impactColors = {
    high: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Smart Budget</CardTitle>
          </div>
          <CardDescription>AI-powered budget recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Analyzing your spending patterns...</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg border space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Unable to Load Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn&apos;t generate budget recommendations at this time.
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.recommendation) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Smart Budget</CardTitle>
          </div>
          <CardDescription>AI-powered budget recommendations</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {data?.message || 'Upload more receipts to get personalized budget recommendations.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { recommendation } = data;
  const savingsPercent = data.data
    ? Math.round((recommendation.savingsGoal / data.data.avgMonthly) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Smart Budget
            </CardTitle>
            <CardDescription>
              AI-powered recommendations based on {data.data?.months || months} months of spending
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="text-sm border rounded-md px-2 py-1 bg-background"
              disabled={isFetching}
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Monthly Budget</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(recommendation.monthlyBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended target
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Savings Goal</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(recommendation.savingsGoal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsPercent}% of current spending
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(
                recommendation.categoryBudgets.reduce((sum, c) => sum + c.savingsPotential, 0)
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total opportunity
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Key Insights</h3>
          </div>
          <div className="grid gap-2">
            {recommendation.keyInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Budgets */}
        <div className="space-y-3">
          <button
            onClick={() => setExpandedCategories(!expandedCategories)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm flex-1">Category Budgets</h3>
            {expandedCategories ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <div className={cn('space-y-2', !expandedCategories && 'max-h-48 overflow-hidden')}>
            {recommendation.categoryBudgets.map((cat, idx) => {
              const progress = Math.min(100, (cat.currentSpending / cat.recommendedBudget) * 100);
              const isOverBudget = cat.currentSpending > cat.recommendedBudget;

              return (
                <div key={idx} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{cat.category}</span>
                      <Badge variant="secondary" className={cn('text-xs', priorityColors[cat.priority])}>
                        {cat.priority}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-medium', isOverBudget && 'text-destructive')}>
                        {formatCurrency(cat.currentSpending)} / {formatCurrency(cat.recommendedBudget)}
                      </p>
                      {cat.savingsPotential > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Save {formatCurrency(cat.savingsPotential)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={progress}
                    className={cn('h-2', isOverBudget && '[&>div]:bg-destructive')}
                  />
                </div>
              );
            })}
          </div>

          {!expandedCategories && recommendation.categoryBudgets.length > 3 && (
            <button
              onClick={() => setExpandedCategories(true)}
              className="text-sm text-primary hover:underline"
            >
              Show all {recommendation.categoryBudgets.length} categories
            </button>
          )}
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Action Items</h3>
          </div>
          <div className="grid gap-2">
            {recommendation.actionItems.map((item, idx) => (
              <div
                key={idx}
                className={cn('flex items-start gap-3 p-3 rounded-lg border', impactColors[item.impact])}
              >
                <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  {item.potentialSavings && (
                    <p className="text-xs mt-1 opacity-80">
                      Potential savings: {formatCurrency(item.potentialSavings)}/month
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className={cn('shrink-0 text-xs', impactColors[item.impact])}>
                  {item.impact} impact
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
