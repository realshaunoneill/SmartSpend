'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Sparkles,
  PiggyBank,
  Sun,
  Snowflake,
  Leaf,
  CloudSun,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';


interface CategoryForecast {
  category: string;
  predictedAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  reasoning?: string;
}

interface UpcomingExpense {
  description: string;
  estimatedAmount: number;
  estimatedDate: string;
  isRecurring: boolean;
}

interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  suggestion: string;
}

interface ForecastAnalysis {
  nextMonthTotal: number;
  confidence: 'high' | 'medium' | 'low';
  categoryForecasts: CategoryForecast[];
  upcomingExpenses: UpcomingExpense[];
  savingsOpportunities: SavingsOpportunity[];
  seasonalFactors: string[];
  summary: string;
}

interface ForecastResponse {
  forecast: ForecastAnalysis | null;
  message?: string;
  currency: string;
  monthsAnalyzed: number;
}

interface SpendingForecastProps {
  householdId?: string;
}

export function SpendingForecast({ householdId }: SpendingForecastProps) {
  const { format: formatCurrency } = useCurrency();

  const { data, isLoading, error } = useQuery<ForecastResponse>({
    queryKey: ['spending-forecast', householdId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (householdId) params.append('householdId', householdId);

      const response = await fetch(`/api/receipts/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Medium Confidence
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Low Confidence
          </Badge>
        );
    }
  };

  const getSeasonIcon = (factor: string) => {
    const lowerFactor = factor.toLowerCase();
    if (lowerFactor.includes('winter') || lowerFactor.includes('holiday') || lowerFactor.includes('christmas')) {
      return <Snowflake className="h-4 w-4 text-blue-400" />;
    }
    if (lowerFactor.includes('summer') || lowerFactor.includes('vacation')) {
      return <Sun className="h-4 w-4 text-yellow-500" />;
    }
    if (lowerFactor.includes('spring') || lowerFactor.includes('easter')) {
      return <Leaf className="h-4 w-4 text-green-500" />;
    }
    return <CloudSun className="h-4 w-4 text-orange-400" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Spending Forecast
          </CardTitle>
          <CardDescription>AI-powered prediction for next month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Spending Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load forecast</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Spending Forecast
          </CardTitle>
          <CardDescription>AI-powered prediction for next month</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {data?.message || 'Not enough spending history to generate a forecast'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Keep scanning receipts to enable AI predictions
          </p>
        </CardContent>
      </Card>
    );
  }

  const forecast = data.forecast;
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const monthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Main Forecast Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthName} Forecast
                <Badge variant="outline" className="ml-2 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </CardTitle>
              <CardDescription>
                Based on {data.monthsAnalyzed} months of spending data
              </CardDescription>
            </div>
            {getConfidenceBadge(forecast.confidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Predicted Total */}
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Predicted Total Spending</p>
            <p className="text-4xl font-bold">{formatCurrency(forecast.nextMonthTotal)}</p>
          </div>

          {/* Summary */}
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm">{forecast.summary}</p>
          </div>

          {/* Seasonal Factors */}
          {forecast.seasonalFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Seasonal Factors</h4>
              <div className="flex flex-wrap gap-2">
                {forecast.seasonalFactors.map((factor, idx) => (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1">
                    {getSeasonIcon(factor)}
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
          <CardDescription>Predicted spending by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {forecast.categoryForecasts.map((cat, idx) => {
            const percentage = (cat.predictedAmount / forecast.nextMonthTotal) * 100;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(cat.trend)}
                    <span className="font-medium capitalize">{cat.category}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(cat.predictedAmount)}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                {cat.reasoning && (
                  <p className="text-xs text-muted-foreground">{cat.reasoning}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upcoming Expenses */}
      {forecast.upcomingExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Expenses
            </CardTitle>
            <CardDescription>Expected bills and recurring charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.upcomingExpenses.map((expense, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {expense.isRecurring && (
                      <Badge variant="secondary" className="text-xs">
                        Recurring
                      </Badge>
                    )}
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Expected: {expense.estimatedDate}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(expense.estimatedAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Opportunities */}
      {forecast.savingsOpportunities.length > 0 && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <PiggyBank className="h-5 w-5" />
              Savings Opportunities
            </CardTitle>
            <CardDescription>Ways to reduce your spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecast.savingsOpportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-green-500/5 rounded-lg border border-green-500/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {opp.category}
                    </Badge>
                    <span className="text-green-600 font-semibold">
                      Save {formatCurrency(opp.potentialSavings)}
                    </span>
                  </div>
                  <p className="text-sm">{opp.suggestion}</p>
                </div>
              ))}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Total potential savings:{' '}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      forecast.savingsOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0),
                    )}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
