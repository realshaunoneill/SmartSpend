'use client';

import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, isToday, isTomorrow, format } from 'date-fns';

type NextPaymentBadgeProps = {
  nextBillingDate: Date | string | null;
  amount: string;
  currency?: string;
};

export function NextPaymentBadge({ nextBillingDate, amount, currency = 'EUR' }: NextPaymentBadgeProps) {
  if (!nextBillingDate) return null;

  const now = new Date();
  const billingDate = new Date(nextBillingDate);
  const daysUntil = differenceInDays(billingDate, now);

  // Don't show if billing date is in the past
  if (daysUntil < 0) return null;

  const isUrgent = daysUntil <= 2;
  const isWithinWeek = daysUntil <= 7;

  const getDateLabel = () => {
    if (isToday(billingDate)) return 'Today';
    if (isTomorrow(billingDate)) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
    return format(billingDate, 'MMM dd');
  };

  const getVariant = () => {
    if (isUrgent) return 'destructive';
    if (isWithinWeek) return 'default';
    return 'secondary';
  };

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency;

  return (
    <Badge variant={getVariant()} className="gap-1.5">
      <Clock className="w-3 h-3" />
      <span>{getDateLabel()}</span>
      <span>•</span>
      <span className="font-semibold">{currencySymbol}{parseFloat(amount).toFixed(2)}</span>
    </Badge>
  );
}
