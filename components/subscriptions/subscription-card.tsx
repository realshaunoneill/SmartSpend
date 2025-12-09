'use client';

import { DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LinkReceiptDialog } from './link-receipt-dialog';
import { Subscription, SubscriptionPayment } from '@/lib/db/schema';

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
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {subscription.name}
              {subscription.isBusinessExpense && (
                <Badge variant="secondary">Business</Badge>
              )}
            </CardTitle>
            {subscription.description && (
              <CardDescription className="mt-1">{subscription.description}</CardDescription>
            )}
          </div>
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Amount and Frequency */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <DollarSign className="w-6 h-6" />
              €{parseFloat(subscription.amount).toFixed(2)}
            </div>
            <Badge variant="outline">{subscription.billingFrequency}</Badge>
            {subscription.category && (
              <Badge variant="outline">{subscription.category}</Badge>
            )}
          </div>

          {/* Next Billing Date */}
          {subscription.nextBillingDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}

          {/* Missing Payments Alert */}
          {subscription.missingPayments && subscription.missingPayments > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {subscription.missingPayments} missing {subscription.missingPayments === 1 ? 'receipt' : 'receipts'}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
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
        </div>
      </CardContent>
    </Card>
  );
}
