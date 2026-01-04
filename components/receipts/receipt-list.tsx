'use client';

import { useState } from 'react';
import { ReceiptIcon, Calendar, Store, Users, AlertCircle, RefreshCw, Clock, CheckCircle, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReceiptDetailModal } from '@/components/receipts/receipt-detail-modal';
import { formatCategory } from '@/lib/utils/format-category';
import type { ReceiptWithItems } from '@/lib/types/api-responses';
import { toast } from 'sonner';

interface ReceiptListProps {
  receipts: ReceiptWithItems[];
  onReceiptClick?: (receipt: ReceiptWithItems) => void;
  onRetry?: () => void;
}

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-500/10 text-green-700 dark:text-green-400',
  dining: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  transportation: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  shopping: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  utilities: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  entertainment: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  healthcare: 'bg-red-500/10 text-red-700 dark:text-red-400',
  travel: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

export function ReceiptList({ receipts, onReceiptClick, onRetry }: ReceiptListProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithItems | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleRetry = async (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(receiptId);

    try {
      const response = await fetch(`/api/receipts/${receiptId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry processing');
      }

      toast.success('Receipt processing completed successfully');

      // Call the onRetry callback to refresh the list
      if (onRetry) {
        onRetry();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry processing');
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Processing - Wait a minute, if it doesn't complete contact support
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed - Please contact support
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Processing - Wait a minute, if it doesn't complete contact support
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleReceiptClick = (receipt: ReceiptWithItems) => {
    if (onReceiptClick) {
      onReceiptClick(receipt);
    } else {
      setSelectedReceipt(receipt);
      setModalOpen(true);
    }
  };

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon className="h-5 w-5" />
          Recent Receipts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ReceiptIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">No receipts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Upload your first receipt to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => handleReceiptClick(receipt)}
                className="flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 cursor-pointer sm:flex-row sm:items-center sm:gap-4 sm:p-4"
              >
                {/* Receipt Image Thumbnail */}
                <div className="shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
                    {receipt.imageUrl ? (
                      <img
                        src={receipt.imageUrl || '/placeholder.svg'}
                        alt={`Receipt from ${receipt.merchantName || 'merchant'}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ReceiptIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {receipt.merchantName || 'Unknown Merchant'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground sm:whitespace-nowrap">
                      {receipt.currency || '$'} {receipt.totalAmount || '0.00'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3">
                    {receipt.transactionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{receipt.transactionDate}</span>
                        <span className="sm:hidden">{formatDate(receipt.transactionDate)}</span>
                      </div>
                    )}
                    {receipt.processingStatus && getStatusBadge(receipt.processingStatus)}
                    {receipt.category && (
                      <Badge variant="secondary" className={categoryColors[receipt.category] || categoryColors.other}>
                        {formatCategory(receipt.category)}
                      </Badge>
                    )}
                    {receipt.paymentMethod && (
                      <span className="capitalize">{receipt.paymentMethod.replace('_', ' ')}</span>
                    )}
                    {receipt.items && receipt.items.length > 0 && (
                      <span>{receipt.items.length} items</span>
                    )}
                    {receipt.householdId && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {receipt.isBusinessExpense && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Business
                      </Badge>
                    )}
                    {receipt.submittedBy && receipt.householdId && (
                      <span className="text-xs">
                        by {receipt.submittedBy.split('@')[0]}
                      </span>
                    )}
                  </div>

                  {/* Retry Button for Failed Receipts */}
                  {receipt.processingStatus === 'failed' && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleRetry(receipt.id, e)}
                        disabled={retryingId === receipt.id}
                        className="text-xs"
                      >
                        {retryingId === receipt.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry Processing
                          </>
                        )}
                      </Button>
                      {receipt.processingError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {receipt.processingError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      {!onReceiptClick && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
