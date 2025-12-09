'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateSubscriptionDialog } from './create-subscription-dialog';

type SubscriptionEmptyStateProps = {
  status: string;
};

export function SubscriptionEmptyState({ status }: SubscriptionEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No {status} subscriptions</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {status === 'active'
            ? 'Start tracking your recurring expenses by adding your first subscription.'
            : `You don't have any ${status} subscriptions.`
          }
        </p>
        {status === 'active' && <CreateSubscriptionDialog />}
      </CardContent>
    </Card>
  );
}
