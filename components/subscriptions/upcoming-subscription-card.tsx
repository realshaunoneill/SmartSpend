'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
import { type Subscription } from '@/lib/db/schema';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';

type UpcomingSubscriptionCardProps = {
  subscription: Subscription;
  onClick?: () => void;
};

export function UpcomingSubscriptionCard({ subscription, onClick }: UpcomingSubscriptionCardProps) {
  if (!subscription.nextBillingDate) return null;

  const billingDate = new Date(subscription.nextBillingDate);
  const now = new Date();
  const daysUntil = differenceInDays(billingDate, now);

  const getDateLabel = () => {
    if (isToday(billingDate)) return 'Today';
    if (isTomorrow(billingDate)) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
    return format(billingDate, 'MMM dd, yyyy');
  };

  const getUrgencyColor = () => {
    if (daysUntil === 0) return 'text-red-600 dark:text-red-400';
    if (daysUntil === 1) return 'text-orange-600 dark:text-orange-400';
    if (daysUntil <= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-cyan-500/10 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold truncate">{subscription.name}</CardTitle>
            {subscription.description && (
              <CardDescription className="truncate mt-1">{subscription.description}</CardDescription>
            )}
          </div>
          {subscription.category && (
            <Badge variant="outline" className="ml-2 shrink-0 capitalize">
              {subscription.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className={`font-semibold ${getUrgencyColor()}`}>
                {getDateLabel()}
              </span>
            </div>
            {daysUntil === 0 && (
              <Badge variant="destructive" className="text-xs">
                Due Today
              </Badge>
            )}
            {daysUntil > 0 && daysUntil <= 2 && (
              <Badge variant="secondary" className="text-xs">
                Due Soon
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between pt-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground capitalize">
                {subscription.billingFrequency}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                €{parseFloat(subscription.amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
