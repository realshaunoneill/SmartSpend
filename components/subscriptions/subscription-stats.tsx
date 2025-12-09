'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

type SubscriptionStatsProps = {
  activeCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  missingPayments: number;
};

export function SubscriptionStats({
  activeCount,
  monthlyTotal,
  yearlyTotal,
  missingPayments,
}: SubscriptionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active Subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Monthly Cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€{monthlyTotal.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Yearly Cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€{yearlyTotal.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className={missingPayments > 0 ? 'border-yellow-500' : ''}>
        <CardHeader className="pb-2">
          <CardDescription>Missing Receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-3xl font-bold">{missingPayments}</div>
            {missingPayments > 0 && <AlertCircle className="w-5 h-5 text-yellow-500" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
