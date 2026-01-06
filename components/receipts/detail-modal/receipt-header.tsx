'use client';

import { Store, MapPin, Info, Calendar, Clock, CreditCard, Hash, Receipt as ReceiptIcon, Tag, Building2, AlertCircle, RefreshCw, CheckCircle, Share2, Lock, Home, Upload, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReceiptAssignmentDialog } from '@/components/receipts/receipt-assignment-dialog';
import { DeleteReceiptButton } from './delete-receipt-button';
import { BusinessExpenseDialog } from './business-expense-dialog';
import { formatCategory, capitalizeText } from '@/lib/utils/format-category';
import type { ReceiptWithItems, OCRData } from '@/lib/types/api-responses';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HouseholdInfo {
  id: string;
  name: string;
  members?: Array<{ user_id: string; role: string; email: string }>;
}

interface ReceiptHeaderProps {
  receipt: ReceiptWithItems
  household: HouseholdInfo | null
  isLoadingPermissions: boolean
  canModifyReceipt: boolean
  isReceiptOwner: boolean
  onDeleted: () => void
  onRetrySuccess?: () => void | Promise<void>
}

export function ReceiptHeader({
  receipt,
  household,
  isLoadingPermissions,
  canModifyReceipt,
  isReceiptOwner,
  onDeleted,
  onRetrySuccess,
}: ReceiptHeaderProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showReanalyzeDialog, setShowReanalyzeDialog] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch(`/api/receipts/${receipt.id}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to retry processing');
      }

      toast.success('Receipt processed successfully! The details have been updated.');

      // Call the callback to refresh the receipt data
      if (onRetrySuccess) {
        await onRetrySuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry processing');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setShowReanalyzeDialog(false);

    try {
      const response = await fetch(`/api/receipts/${receipt.id}/retry`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to re-analyze receipt');
      }

      toast.success('Receipt re-analyzed successfully! The details have been updated.');

      // Call the callback to refresh the receipt data
      if (onRetrySuccess) {
        await onRetrySuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to re-analyze receipt');
    } finally {
      setIsReanalyzing(false);
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

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {receipt.merchantName || 'Unknown Merchant'}
              </h2>
              {receipt.ocrData && typeof receipt.ocrData === 'object' && Object.keys(receipt.ocrData).length > 5 ? (
                <Badge variant="default" className="text-xs">
                  <Info className="h-3 w-3 mr-1" />
                  Enhanced
                </Badge>
              ) : null}
              {receipt.processingStatus && getStatusBadge(receipt.processingStatus)}
            </div>
            {receipt.location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {receipt.location}
              </p>
            )}
            {/* Category and Merchant Type */}
            <div className="flex flex-wrap gap-2 mt-2">
              {receipt.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {formatCategory(receipt.category)}
                </Badge>
              )}
              {(() => {
                const ocrData = receipt.ocrData as OCRData | null;
                return ocrData?.merchantType && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {capitalizeText(ocrData.merchantType)}
                  </Badge>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Current Household Badge and Business Expense Display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {household ? (
          <Badge variant="secondary" className="flex items-center gap-2 w-fit bg-primary/10 text-primary">
            <Home className="h-3 w-3" />
            Shared with {household.name}
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-2 w-fit">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        )}
        {receipt.isBusinessExpense && !isReceiptOwner && (
          <Badge variant="secondary" className="flex items-center gap-2 w-fit bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <Building2 className="h-3 w-3" />
            Business Expense
            {receipt.taxDeductible && <span className="ml-1">• Tax Deductible</span>}
          </Badge>
        )}
      </div>

      {/* Processing Error Message */}
      {receipt.processingStatus === 'failed' && receipt.processingError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            <strong>Processing Error:</strong> {receipt.processingError}
          </p>
        </div>
      )}

      {/* Retry Button for Failed Receipts */}
      {receipt.processingStatus === 'failed' && isReceiptOwner && (
        <div className="mt-4">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="default"
            size="sm"
            className="w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Processing
              </>
            )}
          </Button>
        </div>
      )}

      {/* Assignment and Delete Buttons - Show loading state or buttons */}
      <div className="mt-4">
        {isLoadingPermissions ? (
          // Loading skeleton for action buttons
          <div className="flex gap-2">
            <div className="h-9 flex-1 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        ) : canModifyReceipt ? (
          <div className="flex gap-2">
            <ReceiptAssignmentDialog
              receiptId={receipt.id}
              currentHouseholdId={receipt.householdId || undefined}
              isOwner={isReceiptOwner}
              canRemoveOnly={!isReceiptOwner && !!receipt.householdId}
            >
              <Button variant="outline" size="sm" className="flex-1">
                {!isReceiptOwner && receipt.householdId ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Make Private
                  </>
                ) : receipt.householdId ? (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Change Sharing
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Receipt
                  </>
                )}
              </Button>
            </ReceiptAssignmentDialog>

            {/* Delete Button - Only for receipt owner */}
            {isReceiptOwner && (
              <DeleteReceiptButton
                receiptId={receipt.id}
                onDeleted={onDeleted}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 mt-4">
        {/* Receipt/Transaction Date */}
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {receipt.transactionDate
            ? `Receipt: ${receipt.transactionDate}`
            : `Receipt: ${new Date(receipt.createdAt).toLocaleDateString()}`}
        </Badge>
        {/* Upload Date - only show if different from transaction date */}
        <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
          <Upload className="h-3 w-3" />
          Uploaded: {new Date(receipt.createdAt).toLocaleDateString()}
        </Badge>
        {(() => {
          const ocrData = receipt.ocrData as OCRData | null;
          return ocrData?.timeOfDay && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {ocrData.timeOfDay}
            </Badge>
          );
        })()}
        {receipt.paymentMethod && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {capitalizeText(receipt.paymentMethod)}
          </Badge>
        )}
        {receipt.receiptNumber && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {receipt.receiptNumber}
          </Badge>
        )}
        {(() => {
          const ocrData = receipt.ocrData as OCRData | null;
          return ocrData?.orderNumber && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <ReceiptIcon className="h-3 w-3" />
              Order: {ocrData.orderNumber}
            </Badge>
          );
        })()}
      </div>

      {/* Incorrect Details Button - For completed receipts when owner notices issues */}
      {receipt.processingStatus === 'completed' && isReceiptOwner && (
        <div className="mt-4">
          <Dialog open={showReanalyzeDialog} onOpenChange={setShowReanalyzeDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                disabled={isReanalyzing}
              >
                {isReanalyzing ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Incorrect details?
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Incorrect Receipt Details?</DialogTitle>
                <DialogDescription className="space-y-3">
                  <span className="block">
                    If the extracted details don&apos;t match your receipt, you can try re-analyzing the image. This will re-scan and update all details including merchant name, date, items, and totals.
                  </span>
                  <span className="block text-muted-foreground">
                    If re-analyzing doesn&apos;t fix the issue, please contact our support team for assistance.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setShowReanalyzeDialog(false);
                    window.open('/support', '_blank');
                  }}
                >
                  Contact Support
                </Button>
                <Button
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="w-full sm:w-auto"
                >
                  {isReanalyzing ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Re-analyze Receipt
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Business Expense Section - Only for receipt owner */}
      {isReceiptOwner && (
        <div className="mt-4">
          <BusinessExpenseDialog
            receiptId={receipt.id}
            isBusinessExpense={receipt.isBusinessExpense || false}
            businessCategory={receipt.businessCategory}
            businessNotes={receipt.businessNotes}
            taxDeductible={receipt.taxDeductible || false}
          />
        </div>
      )}
    </div>
  );
}
