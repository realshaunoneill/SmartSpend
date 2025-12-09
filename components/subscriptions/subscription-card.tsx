'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkReceiptDialog } from './link-receipt-dialog';
import { NextPaymentBadge } from './next-payment-badge';
import { type Subscription, type SubscriptionPayment } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

type SubscriptionWithPayments = Subscription & {
  missingPayments?: number;
  recentPayments?: SubscriptionPayment[];
};

type SubscriptionCardProps = {
  subscription: SubscriptionWithPayments;
  onClick: () => void;
};

export function SubscriptionCard({ subscription, onClick }: SubscriptionCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer',
        'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1',
      )}
      onClick={onClick}
    >
      <CardContent className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold truncate">{subscription.name}</h3>
              {subscription.isBusinessExpense && (
                <Badge variant="secondary" className="text-xs">Business</Badge>
              )}
            </div>
            {subscription.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{subscription.description}</p>
            )}
          </div>
          <Badge
            variant={subscription.status === 'active' ? 'default' : 'secondary'}
            className="capitalize shrink-0"
          >
            {subscription.status}
          </Badge>
        </div>

        {/* Amount Section */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">
            €{parseFloat(subscription.amount).toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">/ {subscription.billingFrequency}</span>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-2">
          {subscription.category && (
            <Badge variant="outline" className="text-xs">
              {subscription.category}
            </Badge>
          )}
          {subscription.website && (
            <Badge variant="outline" className="text-xs gap-1">
              <ExternalLink className="w-3 h-3" />
              Website
            </Badge>
          )}
        </div>

        {/* Next Payment Badge */}
        {subscription.nextBillingDate && (
          <NextPaymentBadge
            nextBillingDate={subscription.nextBillingDate}
            amount={subscription.amount}
            currency={subscription.currency}
          />
        )}

        {/* Missing Payments Alert */}
        {subscription.missingPayments !== undefined && subscription.missingPayments > 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              {subscription.missingPayments} missing {subscription.missingPayments === 1 ? 'receipt' : 'receipts'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </Button>
          <LinkReceiptDialog
            subscription={subscription}
            payments={subscription.recentPayments || []}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Link Receipt
            </Button>
          </LinkReceiptDialog>
        </div>
      </CardContent>
    </Card>
  );
}
