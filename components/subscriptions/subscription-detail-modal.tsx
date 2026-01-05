'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  DollarSign,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit,
  Pause,
  Play,
  X,
  Receipt as ReceiptIcon,
  Link as LinkIcon,
  Unlink,
  Eye,
} from 'lucide-react';
import { useSubscription, useDeleteSubscription, useUpdateSubscription, useUnlinkPayment } from '@/hooks/use-subscriptions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { LinkReceiptDialog } from './link-receipt-dialog';
import { EditSubscriptionDialog } from './edit-subscription-dialog';

type SubscriptionDetailModalProps = {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SubscriptionDetailModal({
  subscriptionId,
  open,
  onOpenChange,
}: SubscriptionDetailModalProps) {
  const router = useRouter();
  const { data: subscription, isLoading } = useSubscription(subscriptionId || '');
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { mutate: updateSubscription } = useUpdateSubscription(subscriptionId || '');
  const { mutate: unlinkPayment } = useUnlinkPayment(subscriptionId || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = () => {
    if (!subscriptionId) return;

    deleteSubscription(subscriptionId, {
      onSuccess: () => {
        toast.success('Subscription deleted');
        onOpenChange(false);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error('Failed to delete. Please try again.');
      },
    });
  };

  const handleToggleStatus = () => {
    if (!subscription) return;

    const newStatus = subscription.status === 'active' ? 'paused' : 'active';

    updateSubscription(
      { status: newStatus },
      {
        onSuccess: () => {
          toast.success(`${subscription.name} is now ${newStatus}`);
        },
        onError: () => {
          toast.error('Failed to update status. Please try again.');
        },
      },
    );
  };

  const handleCancel = () => {
    if (!subscription) return;

    updateSubscription(
      { status: 'cancelled', endDate: new Date() },
      {
        onSuccess: () => {
          toast.success(`${subscription.name} has been cancelled`);
        },
        onError: () => {
          toast.error('Failed to cancel. Please try again.');
        },
      },
    );
  };

  const handleUnlinkReceipt = (paymentId: string) => {
    unlinkPayment(paymentId, {
      onSuccess: () => {
        toast.success('Receipt unlinked');
      },
      onError: () => {
        toast.error('Failed to unlink. Please try again.');
      },
    });
  };

  const handleViewReceipt = (receiptId: string) => {
    router.push(`/receipts?selected=${receiptId}`);
    onOpenChange(false);
  };

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {subscription?.name}? This will remove all
              payment records and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : subscription ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    {subscription.name}
                    {subscription.isBusinessExpense && (
                      <Badge variant="secondary">Business</Badge>
                    )}
                  </DialogTitle>
                  {subscription.description && (
                    <DialogDescription className="mt-2">
                      {subscription.description}
                    </DialogDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={subscription.status === 'active' ? 'default' : 'secondary'}
                  >
                    {subscription.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleToggleStatus}>
                        {subscription.status === 'active' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        )}
                      </DropdownMenuItem>
                      {subscription.status !== 'cancelled' && (
                        <DropdownMenuItem onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <DollarSign className="w-5 h-5" />
                      {subscription.currency === 'EUR' ? '€' : subscription.currency === 'USD' ? '$' : '£'}
                      {parseFloat(subscription.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Frequency</span>
                    <Badge variant="outline">
                      {subscription.billingFrequency}
                      {subscription.billingFrequency === 'custom' &&
                        ` (${subscription.customFrequencyDays} days)`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Billing Day</span>
                    <span className="font-medium">Day {subscription.billingDay}</span>
                  </div>
                  {subscription.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Badge variant="outline">{subscription.category}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Important Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(subscription.startDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {subscription.nextBillingDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Next Billing</span>
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  {subscription.lastPaymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Payment</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(subscription.lastPaymentDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  {subscription.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(subscription.endDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              {subscription.payments && subscription.payments.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg">Payment History</CardTitle>
                    <LinkReceiptDialog
                      subscription={subscription}
                      payments={subscription.payments}
                    >
                      <Button variant="outline" size="sm">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Link Receipt
                      </Button>
                    </LinkReceiptDialog>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {subscription.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <ReceiptIcon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {format(
                                  new Date(payment.expectedDate),
                                  'MMM d, yyyy',
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Expected: €{payment.expectedAmount ? parseFloat(payment.expectedAmount.toString()).toFixed(2) : '0.00'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                payment.status === 'paid'
                                  ? 'default'
                                  : payment.status === 'missed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {payment.status}
                            </Badge>
                            {payment.receiptId && (
                              <>
                                <Badge variant="outline">
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Linked
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewReceipt(payment.receiptId!)}
                                  title="View Receipt"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleUnlinkReceipt(payment.id)}
                                  title="Unlink Receipt"
                                >
                                  <Unlink className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {(subscription.website || subscription.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subscription.website && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Website</p>
                        <a
                          href={subscription.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          {subscription.website}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    {subscription.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{subscription.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Subscription not found</p>
          </div>
        )}
      </DialogContent>

      {/* Edit Subscription Dialog */}
      {subscription && (
        <EditSubscriptionDialog
          subscription={subscription}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
