'use client';

import { Calendar, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Subscription } from '@/lib/db/schema';
import { differenceInDays, format, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

type NextSubscriptionCardProps = {
  subscription: Subscription;
  onClick: () => void;
};

export function NextSubscriptionCard({ subscription, onClick }: NextSubscriptionCardProps) {
  const now = new Date();
  const billingDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
  const daysUntil = billingDate ? differenceInDays(billingDate, now) : null;

  const getDateLabel = () => {
    if (!billingDate) return '';
    if (isToday(billingDate)) return 'Due Today';
    if (isTomorrow(billingDate)) return 'Due Tomorrow';
    if (daysUntil !== null && daysUntil <= 7) return `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
    return `Due ${format(billingDate, 'MMM dd, yyyy')}`;
  };

  const isUrgent = daysUntil !== null && daysUntil <= 2;
  const isWithinWeek = daysUntil !== null && daysUntil <= 7;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 cursor-pointer border-2',
        'hover:shadow-xl',
        isUrgent && 'border-red-500/50 bg-red-500/5',
        isWithinWeek && !isUrgent && 'border-blue-500/50 bg-blue-500/5',
        !isWithinWeek && 'border-border',
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-6">
          {/* Left Section - Subscription Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={cn(
                'p-3 rounded-xl shrink-0',
                isUrgent && 'bg-red-500/10',
                isWithinWeek && !isUrgent && 'bg-blue-500/10',
                !isWithinWeek && 'bg-muted',
              )}>
                <Clock className={cn(
                  'w-6 h-6',
                  isUrgent && 'text-red-600 dark:text-red-400',
                  isWithinWeek && !isUrgent && 'text-blue-600 dark:text-blue-400',
                  !isWithinWeek && 'text-muted-foreground',
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold truncate">{subscription.name}</h3>
                  {subscription.isBusinessExpense && (
                    <Badge variant="secondary" className="text-xs">Business</Badge>
                  )}
                  <Badge
                    variant={subscription.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {subscription.status}
                  </Badge>
                </div>

                {subscription.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                    {subscription.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {subscription.category && (
                    <Badge variant="outline" className="text-xs">
                      {subscription.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {subscription.billingFrequency}
                  </Badge>
                  {subscription.website && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Payment Info */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-bold tracking-tight">
                  €{parseFloat(subscription.amount).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.billingFrequency}
              </p>
            </div>

            {billingDate && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                <span className={cn(
                  isUrgent && 'text-red-600 dark:text-red-400',
                  isWithinWeek && !isUrgent && 'text-blue-600 dark:text-blue-400',
                )}>
                  {getDateLabel()}
                </span>
              </div>
            )}

            <Button
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
