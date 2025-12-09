'use client';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSpendingTrends } from '@/lib/hooks/use-spending-trends';

interface SpendingSummaryProps {
  period: 'week' | 'month' | 'year'
  onPeriodChange: (period: 'week' | 'month' | 'year') => void
  householdId?: string
  personalOnly?: boolean
}

export function SpendingSummary({ period, onPeriodChange, householdId, personalOnly = false }: SpendingSummaryProps) {
  const { data: trendsData, isLoading, error } = useSpendingTrends(householdId, period, personalOnly);

  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Total Spending</CardTitle>
              <CardDescription>{periodLabels[period]}</CardDescription>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading spending data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Total Spending</CardTitle>
              <CardDescription>{periodLabels[period]}</CardDescription>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-destructive">Failed to load spending data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trendsData || trendsData.totalSpent === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Total Spending</CardTitle>
              <CardDescription>{periodLabels[period]}</CardDescription>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
              <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No spending yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload receipts to track your spending for {periodLabels[period].toLowerCase()}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = trendsData.change >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Total Spending</CardTitle>
            <CardDescription>{periodLabels[period]}</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Amount */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">
            ${trendsData.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {trendsData.change !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositiveChange ? 'text-destructive' : 'text-primary'
              }`}
            >
              {isPositiveChange ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trendsData.change)}%
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        {trendsData.spendingByCategory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">By Category</h4>
            <div className="space-y-3">
              {trendsData.spendingByCategory.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{item.category}</span>
                    <span className="font-medium text-foreground">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {trendsData.spendingByCategory.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{trendsData.spendingByCategory.length - 5} more categories
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
