'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Receipt, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  stats: {
    totalReceipts: number
    totalTransactions: number
    avgSpending: number
    topCategory: string
  }
}

const statConfig = [
  {
    key: 'totalReceipts',
    label: 'Total Receipts',
    icon: Receipt,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Uploaded this month',
  },
  {
    key: 'totalTransactions',
    label: 'Items Tracked',
    icon: ShoppingBag,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Individual purchases',
  },
  {
    key: 'avgSpending',
    label: 'Daily Average',
    icon: TrendingUp,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    description: 'Past 30 days',
    isCurrency: true,
  },
  {
    key: 'topCategory',
    label: 'Top Category',
    icon: Wallet,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Most frequent',
    isCapitalized: true,
  },
];

export function QuickStats({ stats }: QuickStatsProps) {
  const { format: formatCurrency } = useCurrency();

  const getValue = (key: string, isCurrency?: boolean, isCapitalized?: boolean) => {
    const value = stats[key as keyof typeof stats];
    if (isCurrency) return formatCurrency(value as number);
    if (isCapitalized && typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value;
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.key}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {/* Subtle gradient background */}
            <div className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              stat.bgColor,
            )} />

            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={cn(
                    'text-2xl font-bold tracking-tight text-foreground',
                    stat.isCapitalized && 'capitalize',
                  )}>
                    {getValue(stat.key, stat.isCurrency, stat.isCapitalized)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={cn(
                  'rounded-xl p-3 transition-transform duration-300 group-hover:scale-110',
                  stat.bgColor,
                )}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
