'use client';

import { TrendingUp, Calendar, Bell, PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CreateSubscriptionDialog } from './create-subscription-dialog';

type SubscriptionEmptyStateProps = {
  status: string;
};

export function SubscriptionEmptyState({ status }: SubscriptionEmptyStateProps) {
  if (status !== 'active') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No {status} subscriptions</h3>
          <p className="text-sm text-muted-foreground text-center">
            You don&apos;t have any {status} subscriptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="py-12 px-6">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          {/* Icon */}
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <TrendingUp className="w-10 h-10 text-primary" />
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold mb-2">Track Your Subscriptions</h3>
          <p className="text-muted-foreground mb-8">
            Never miss a payment again. Add your subscriptions to get insights on your recurring expenses.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <Calendar className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium">Payment Reminders</span>
              <span className="text-xs text-muted-foreground">Never miss a due date</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <PieChart className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium">Cost Analysis</span>
              <span className="text-xs text-muted-foreground">See monthly & yearly totals</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
              <Bell className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium">Receipt Matching</span>
              <span className="text-xs text-muted-foreground">Link receipts to subscriptions</span>
            </div>
          </div>

          {/* CTA */}
          <CreateSubscriptionDialog />
        </div>
      </CardContent>
    </Card>
  );
}
