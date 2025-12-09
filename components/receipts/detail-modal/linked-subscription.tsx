'use client';

import { Repeat, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type LinkedSubscriptionProps = {
  receiptId: string;
};

type SubscriptionPayment = {
  id: string;
  subscriptionId: string;
  expectedDate: string;
  expectedAmount: string;
  status: string;
  subscription?: {
    id: string;
    name: string;
    amount: string;
    currency: string;
    billingFrequency: string;
    status: string;
    isBusinessExpense: boolean;
  };
};

export function LinkedSubscription({ receiptId }: LinkedSubscriptionProps) {
  const { data: payment, isLoading } = useQuery<SubscriptionPayment>({
    queryKey: ['receipt-subscription', receiptId],
    queryFn: async () => {
      const res = await fetch(`/api/receipts/${receiptId}/subscription`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch subscription link');
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!payment?.subscription) {
    return null;
  }

  const { subscription } = payment;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Repeat className="w-5 h-5" />
          Linked Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-base">{subscription.name}</h4>
                {subscription.isBusinessExpense && (
                  <Badge variant="secondary" className="text-xs">
                    Business
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {subscription.currency === 'EUR' ? '€' : '$'}
                    {parseFloat(subscription.amount).toFixed(2)} /{' '}
                    {subscription.billingFrequency}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Expected: {format(new Date(payment.expectedDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant={subscription.status === 'active' ? 'default' : 'secondary'}
            >
              {subscription.status}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              window.location.href = `/subscriptions?selected=${subscription.id}`;
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
