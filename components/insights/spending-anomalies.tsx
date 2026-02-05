'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/hooks/use-currency';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Store,
  Calendar,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpendingAnomaly } from '@/lib/openai';

interface SpendingAnomaliesProps {
  householdId?: string;
}

interface AnomalyResponse {
  analysis: SpendingAnomaly | null;
  data?: {
    recentTransactionCount: number;
    historicalTransactionCount: number;
    currency: string;
    analyzedPeriod: string;
    comparisonPeriod: string;
  };
  message?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const anomalyTypeIcons = {
  price_spike: TrendingUp,
  unusual_merchant: Store,
  frequency_change: Calendar,
  category_spike: ShoppingCart,
  large_purchase: CreditCard,
};

const anomalyTypeLabels = {
  price_spike: 'Price Change',
  unusual_merchant: 'New Merchant',
  frequency_change: 'Frequency Change',
  category_spike: 'Category Spike',
  large_purchase: 'Large Purchase',
};

const severityConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  alert: {
    icon: AlertCircle,
    color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-400',
  },
};

const riskColors = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-red-600 dark:text-red-400',
};

export function SpendingAnomalies({ householdId }: SpendingAnomaliesProps) {
  const { format: formatCurrency } = useCurrency();

  const { data, isLoading, error, refetch, isFetching } = useQuery<AnomalyResponse>({
    queryKey: ['spending-anomalies', householdId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (householdId) params.set('householdId', householdId);

      const res = await fetch(`/api/receipts/anomalies?${params}`);
      if (!res.ok) throw new Error('Failed to fetch anomalies');
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    enabled: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Spending Alerts</CardTitle>
          </div>
          <CardDescription>AI monitors your spending for unusual patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Scanning for anomalies...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
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
            Unable to Load Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn&apos;t scan for spending anomalies at this time.
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.analysis) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Spending Alerts</CardTitle>
          </div>
          <CardDescription>AI monitors your spending for unusual patterns</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {data?.message || 'Upload more receipts to enable anomaly detection.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { analysis } = data;
  const hasAnomalies = analysis.anomalies.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Spending Alerts
            </CardTitle>
            <CardDescription>
              Analyzed {data.data?.recentTransactionCount || 0} recent transactions
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Assessment */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              analysis.overallRisk === 'low' && 'bg-emerald-500/10',
              analysis.overallRisk === 'medium' && 'bg-amber-500/10',
              analysis.overallRisk === 'high' && 'bg-red-500/10',
            )}>
              {analysis.overallRisk === 'low' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : analysis.overallRisk === 'medium' ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">Risk Level</p>
              <p className={cn('text-lg font-bold capitalize', riskColors[analysis.overallRisk])}>
                {analysis.overallRisk}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {analysis.anomalies.length} {analysis.anomalies.length === 1 ? 'alert' : 'alerts'} found
            </p>
          </div>
        </div>

        {/* Summary */}
        {analysis.summary && (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm">{analysis.summary}</p>
          </div>
        )}

        {/* Anomalies List */}
        {hasAnomalies ? (
          <div className="space-y-3">
            {analysis.anomalies.map((anomaly, idx) => {
              const config = severityConfig[anomaly.severity];
              const SeverityIcon = config.icon;
              const TypeIcon = anomalyTypeIcons[anomaly.type] || Info;

              return (
                <div
                  key={idx}
                  className={cn('p-4 rounded-lg border', config.color)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-background/50 shrink-0">
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{anomaly.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={cn('text-xs', config.badgeColor)}>
                              <SeverityIcon className="h-3 w-3 mr-1" />
                              {anomaly.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {anomalyTypeLabels[anomaly.type]}
                            </Badge>
                          </div>
                        </div>
                        {anomaly.amount && (
                          <p className="font-semibold text-sm shrink-0">
                            {formatCurrency(anomaly.amount)}
                          </p>
                        )}
                      </div>

                      <p className="text-sm opacity-90">{anomaly.description}</p>

                      {anomaly.comparison && (
                        <p className="text-xs opacity-70">
                          <span className="font-medium">Comparison:</span> {anomaly.comparison}
                        </p>
                      )}

                      {anomaly.recommendation && (
                        <div className="p-2 rounded bg-background/50 mt-2">
                          <p className="text-xs">
                            <span className="font-medium">💡 Tip:</span> {anomaly.recommendation}
                          </p>
                        </div>
                      )}

                      {(anomaly.merchant || anomaly.date) && (
                        <div className="flex items-center gap-3 text-xs opacity-70 mt-1">
                          {anomaly.merchant && (
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {anomaly.merchant}
                            </span>
                          )}
                          {anomaly.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {anomaly.date}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="font-medium text-emerald-600 dark:text-emerald-400">
              All Clear!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No unusual spending patterns detected in the past 30 days.
            </p>
          </div>
        )}

        {/* Footer info */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Analyzing {data.data?.analyzedPeriod} against {data.data?.comparisonPeriod} of history
        </p>
      </CardContent>
    </Card>
  );
}
