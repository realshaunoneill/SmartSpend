'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/use-currency';

interface QuickStatsProps {
  stats: {
    totalReceipts: number
    totalTransactions: number
    avgSpending: number
    topCategory: string
  }
}

export function QuickStats({ stats }: QuickStatsProps) {
  const { format: formatCurrency } = useCurrency();

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalReceipts}</div>
          <p className="text-xs text-muted-foreground">Uploaded this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">Items tracked</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgSpending)}</div>
          <p className="text-xs text-muted-foreground">Past 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize text-foreground">{stats.topCategory}</div>
          <p className="text-xs text-muted-foreground">Most frequent</p>
        </CardContent>
      </Card>
    </div>
  );
}
