'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Tag,
  Store,
  Calendar,

  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface PricePoint {
  date: string;
  price: number;
  merchantName: string;
  quantity: string;
}

interface ItemTrend {
  itemName: string;
  priceHistory: PricePoint[];
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  bestDeal: {
    merchant: string;
    price: number;
    date: string;
  };
}

interface PriceTrendsResponse {
  trends: ItemTrend[];
  totalItemsTracked: number;
}

interface PriceTrendsProps {
  householdId?: string;
}

export function PriceTrends({ householdId }: PriceTrendsProps) {
  const { format: formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const { data, isLoading, error } = useQuery<PriceTrendsResponse>({
    queryKey: ['price-trends', householdId, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (householdId) params.append('householdId', householdId);
      if (debouncedSearchTerm) params.append('itemName', debouncedSearchTerm);
      params.append('limit', '20');

      const response = await fetch(`/api/receipts/price-trends?${params}`);
      if (!response.ok) throw new Error('Failed to fetch price trends');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'stable', percentChange: number) => {
    const absChange = Math.abs(percentChange).toFixed(1);
    switch (trend) {
      case 'up':
        return (
          <Badge variant="destructive" className="text-xs">
            +{absChange}%
          </Badge>
        );
      case 'down':
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs">
            -{absChange}%
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Stable
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Price Trends
          </CardTitle>
          <CardDescription>Track price changes for items you buy frequently</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Price Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load price trends</p>
        </CardContent>
      </Card>
    );
  }

  const trends = data?.trends || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Price Trends
              <Badge variant="outline" className="ml-2 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Tracked
              </Badge>
            </CardTitle>
            <CardDescription>
              Track price changes for items you buy frequently
            </CardDescription>
          </div>
          {data && (
            <Badge variant="secondary">
              {data.totalItemsTracked} items tracked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for an item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {trends.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? 'No items found matching your search'
                : 'Not enough purchase history to show trends'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep scanning receipts to track price trends
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend) => (
              <div
                key={trend.itemName}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedItem(
                    expandedItem === trend.itemName ? null : trend.itemName,
                  )}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTrendIcon(trend.trend)}
                    <div className="text-left">
                      <p className="font-medium">{trend.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.priceHistory.length} purchases tracked
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(trend.currentPrice)}</p>
                      {getTrendBadge(trend.trend, trend.priceChangePercent)}
                    </div>
                    {expandedItem === trend.itemName ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedItem === trend.itemName && (
                  <div className="px-4 pb-4 border-t bg-muted/30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="font-semibold">{formatCurrency(trend.currentPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="font-semibold">{formatCurrency(trend.averagePrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Lowest</p>
                        <p className="font-semibold text-green-600">{formatCurrency(trend.lowestPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Highest</p>
                        <p className="font-semibold text-red-500">{formatCurrency(trend.highestPrice)}</p>
                      </div>
                    </div>

                    {/* Best Deal */}
                    <div className="bg-green-500/10 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Store className="h-4 w-4" />
                        <span className="text-sm font-medium">Best Deal</span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">{formatCurrency(trend.bestDeal.price)}</span>
                        {' at '}
                        <span className="font-medium">{trend.bestDeal.merchant}</span>
                        {' on '}
                        {new Date(trend.bestDeal.date).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Price History */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Recent Purchases
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {trend.priceHistory.slice(-5).reverse().map((point, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {new Date(point.date).toLocaleDateString()}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span>{point.merchantName}</span>
                            </div>
                            <span className={cn(
                              'font-medium',
                              point.price === trend.lowestPrice && 'text-green-600',
                              point.price === trend.highestPrice && 'text-red-500',
                            )}>
                              {formatCurrency(point.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
