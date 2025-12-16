'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
import { type Subscription } from '@/lib/db/schema';
import { differenceInDays, format, isToday, isTomorrow, startOfDay } from 'date-fns';

type UpcomingSubscriptionCardProps = {
  subscription: Subscription;
  onClick?: () => void;
};

export function UpcomingSubscriptionCard({ subscription, onClick }: UpcomingSubscriptionCardProps) {
  if (!subscription.nextBillingDate) return null;

  const billingDate = startOfDay(new Date(subscription.nextBillingDate));
  const today = startOfDay(new Date());
  const daysUntil = differenceInDays(billingDate, today);

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
      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold truncate mb-1">{subscription.name}</h3>
            {subscription.category && (
              <Badge variant="outline" className="text-xs capitalize">
                {subscription.category}
              </Badge>
            )}
          </div>
          {daysUntil === 0 ? (
            <Badge variant="destructive" className="shrink-0">
              Due Today
            </Badge>
          ) : daysUntil === 1 ? (
            <Badge variant="secondary" className="shrink-0">
              Tomorrow
            </Badge>
          ) : null}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm border-t pt-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className={`font-semibold ${getUrgencyColor()}`}>
            {getDateLabel()}
          </span>
          <span className="text-muted-foreground">
            • {format(billingDate, 'MMM dd, yyyy')}
          </span>
        </div>

        {/* Amount */}
        <div className="flex items-baseline justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">
              {subscription.billingFrequency}
            </span>
          </div>
          <span className="text-3xl font-bold">
            €{parseFloat(subscription.amount).toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
