'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Link as LinkIcon, Search, Receipt as ReceiptIcon, Calendar, DollarSign, Unlink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUpdatePayment, useUnlinkPayment } from '@/hooks/use-subscriptions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { type Subscription, type SubscriptionPayment } from '@/lib/db/schema';

type LinkReceiptDialogProps = {
  subscription: Subscription;
  payments: SubscriptionPayment[];
  children?: React.ReactNode;
};

type Receipt = {
  id: string;
  merchantName: string | null;
  totalAmount: string | null;
  currency: string | null;
  transactionDate: string | null;
  category: string | null;
  imageUrl: string;
  createdAt: Date;
};

export function LinkReceiptDialog({ subscription, payments, children }: LinkReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const { mutate: linkReceipt, isPending } = useUpdatePayment(subscription.id);
  const { mutate: unlinkReceipt, isPending: isUnlinking } = useUnlinkPayment(subscription.id);

  // Fetch user's receipts
  const { data: receipts, isLoading: loadingReceipts } = useQuery<Receipt[]>({
    queryKey: ['receipts', 'unlinked'],
    queryFn: async () => {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Failed to fetch receipts');
      const data = await res.json();
      return data.receipts || [];
    },
    enabled: open,
  });

  // Get all payments (show linked ones for unlinking)
  const allPayments = payments;

  // Filter receipts by search query
  const filteredReceipts = receipts?.filter((receipt) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      receipt.merchantName?.toLowerCase().includes(query) ||
      receipt.category?.toLowerCase().includes(query) ||
      receipt.totalAmount?.includes(query)
    );
  });

  const handleLink = () => {
    if (!selectedPaymentId || !selectedReceiptId) {
      toast.error('Please select both a payment and a receipt to link');
      return;
    }

    linkReceipt(
      {
        paymentId: selectedPaymentId,
        data: { receiptId: selectedReceiptId },
      },
      {
        onSuccess: () => {
          toast.success('Receipt linked successfully');
          setOpen(false);
          setSelectedPaymentId(null);
          setSelectedReceiptId(null);
          setSearchQuery('');
        },
        onError: () => {
          toast.error('Failed to link receipt. Please try again.');
        },
      },
    );
  };

  const handleUnlink = (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unlinkReceipt(paymentId, {
      onSuccess: () => {
        toast.success('Receipt unlinked');
      },
      onError: () => {
        toast.error('Failed to unlink receipt. Please try again.');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <LinkIcon className="w-4 h-4 mr-2" />
            Link Receipt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Link Receipt to {subscription.name}</DialogTitle>
          <DialogDescription>
            Select a payment and a receipt to link them together
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Payments Column */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Expected Payments</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Select a payment to link a receipt to
              </p>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {allPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payments found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allPayments.map((payment) => {
                    const isLinked = !!(payment.receiptId && payment.status === 'paid');
                    return (
                      <div
                        key={payment.id}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          selectedPaymentId === payment.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        } ${
                          isLinked ? 'opacity-75' : ''
                        }`}
                      >
                        <button
                          onClick={() => !isLinked && setSelectedPaymentId(payment.id)}
                          className="w-full text-left"
                          disabled={isLinked}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(payment.expectedDate), 'MMM d, yyyy')}
                              </span>
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
                              {isLinked && (
                                <Badge variant="outline">
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Linked
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            Expected: {subscription.currency === 'EUR' ? '€' : '$'}
                            {payment.expectedAmount ? parseFloat(payment.expectedAmount.toString()).toFixed(2) : '0.00'}
                          </div>
                        </button>
                        {isLinked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={(e) => handleUnlink(payment.id, e)}
                            disabled={isUnlinking}
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            {isUnlinking ? 'Unlinking...' : 'Unlink Receipt'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Receipts Column */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Your Receipts</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {loadingReceipts ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading receipts...
                </div>
              ) : filteredReceipts && filteredReceipts.length > 0 ? (
                <div className="space-y-2">
                  {filteredReceipts.map((receipt) => (
                    <button
                      key={receipt.id}
                      onClick={() => setSelectedReceiptId(receipt.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedReceiptId === receipt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={receipt.imageUrl}
                          alt={receipt.merchantName || 'Receipt'}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {receipt.merchantName || 'Unknown Merchant'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {receipt.transactionDate
                              ? format(new Date(receipt.transactionDate), 'MMM d, yyyy')
                              : format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm font-medium mt-1">
                            {receipt.currency === 'EUR' ? '€' : '$'}
                            {receipt.totalAmount ? parseFloat(receipt.totalAmount).toFixed(2) : '0.00'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ReceiptIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No receipts found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">Try a different search term</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending || isUnlinking}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedPaymentId || !selectedReceiptId || isPending || isUnlinking}
          >
            {isPending ? 'Linking...' : 'Link Receipt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
