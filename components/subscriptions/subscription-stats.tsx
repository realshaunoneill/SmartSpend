'use client';

import { AlertCircle, TrendingUp, Calendar, DollarSign, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type SubscriptionStatsProps = {
  activeCount: number;
  monthlyTotal: number;
  yearlyTotal: number;
  missingPayments: number;
  onMissingPaymentsClick?: () => void;
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  alert?: boolean;
  onClick?: () => void;
};

function StatCard({ label, value, icon, iconColor, alert, onClick }: StatCardProps) {
  const CardWrapper = onClick ? 'button' : 'div';
  
  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg',
      alert && 'border-yellow-500/50',
      onClick && 'cursor-pointer hover:border-primary',
    )}>
      <CardContent className="p-6">
        <CardWrapper
          onClick={onClick}
          className={cn(
            'w-full text-left',
            onClick && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg',
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {alert && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              </div>
            </div>
            <div className={cn('p-3 rounded-xl bg-muted', iconColor)}>
              {icon}
            </div>
          </div>
        </CardWrapper>
      </CardContent>
    </Card>
  );
}

export function SubscriptionStats({
  activeCount,
  monthlyTotal,
  yearlyTotal,
  missingPayments,
  onMissingPaymentsClick,
}: SubscriptionStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Active Subscriptions"
        value={activeCount}
        icon={<TrendingUp className="w-5 h-5" />}
        iconColor="text-blue-600 dark:text-blue-400"
      />

      <StatCard
        label="Monthly Cost"
        value={`€${monthlyTotal.toFixed(2)}`}
        icon={<Calendar className="w-5 h-5" />}
        iconColor="text-green-600 dark:text-green-400"
      />

      <StatCard
        label="Yearly Cost"
        value={`€${yearlyTotal.toFixed(2)}`}
        icon={<DollarSign className="w-5 h-5" />}
        iconColor="text-purple-600 dark:text-purple-400"
      />

      <StatCard
        label="Missing Receipts"
        value={missingPayments}
        icon={<Receipt className="w-5 h-5" />}
        iconColor="text-orange-600 dark:text-orange-400"
        alert={missingPayments > 0}
        onClick={missingPayments > 0 ? onMissingPaymentsClick : undefined}
      />
    </div>
  );
}
