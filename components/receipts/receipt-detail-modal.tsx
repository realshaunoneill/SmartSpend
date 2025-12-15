'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ItemAnalysisDialog } from '@/components/insights/item-analysis-dialog';
import { SubscriptionUpsell } from '@/components/subscriptions/subscription-upsell';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { ReceiptHeader } from './detail-modal/receipt-header';
import { ReceiptBusinessDetails } from './detail-modal/receipt-business-details';
import { ReceiptBusinessExpenseInfo } from './detail-modal/receipt-business-expense-info';
import { ReceiptServiceDetails } from './detail-modal/receipt-service-details';
import { ReceiptLoyaltyDetails } from './detail-modal/receipt-loyalty-details';
import { ReceiptItemsList } from './detail-modal/receipt-items-list';
import { ReceiptFinancialBreakdown } from './detail-modal/receipt-financial-breakdown';
import { ReceiptImage } from './detail-modal/receipt-image';
import { LinkedSubscription } from './detail-modal/linked-subscription';
import type { ReceiptWithItems, OCRData, MemberWithUser } from '@/lib/types/api-responses';

interface ReceiptDetailModalProps {
  receipt: ReceiptWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDetailModal({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailModalProps) {
  const [selectedItemForAnalysis, setSelectedItemForAnalysis] = useState<string | null>(null);
  const [showItemAnalysis, setShowItemAnalysis] = useState(false);
  const queryClient = useQueryClient();

  // Fetch household name and user's role if receipt is assigned to one
  const { data: household } = useQuery({
    queryKey: ['household', receipt?.householdId],
    queryFn: async () => {
      if (!receipt?.householdId) return null;

      const response = await fetch(`/api/households/${receipt.householdId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!receipt?.householdId && open,
  });

  // Get current user data to check permissions and subscription
  const { user: currentUser, isLoading: isLoadingUser } = useUser();

  // Check if user can modify this receipt
  const canModifyReceipt = currentUser && receipt && (
    // User is the owner
    receipt.userId === currentUser.id ||
    // Or user is household admin (for removing from household only)
    (receipt.householdId && household?.members?.some((m: MemberWithUser) =>
      m.user_id === currentUser.id && m.role === 'owner',
    ))
  );

  // Check if user is the receipt owner
  const isReceiptOwner = !!(currentUser && receipt && receipt.userId === currentUser.id);

  // Check subscription status
  const isSubscribed = currentUser?.subscribed === true;

  // Check if we're still loading permissions
  const isLoadingPermissions = isLoadingUser || (!!receipt?.householdId && !household && open);

  const handleRetrySuccess = () => {
    // Invalidate queries to refresh receipt data
    if (receipt) {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', receipt.id] });
      queryClient.invalidateQueries({ queryKey: ['recentReceipts'] });
    }
    // Close the modal to show the updated receipt list
    onOpenChange(false);
  };

  if (!receipt) return null;

  // Extract OCR data once to avoid repeated casting
  const ocr = receipt.ocrData as OCRData | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent
          className="p-0 gap-0 h-[95vh] max-h-[95vh] md:h-[95vh]"
          style={{
            width: '95vw',
            maxWidth: '1400px',
          }}
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>Receipt Details - {receipt.merchantName}</DialogTitle>
          </VisuallyHidden>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background dark:hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Mobile: Scrollable vertical layout, Desktop: Grid with fixed columns */}
          <div className="h-full overflow-y-auto md:overflow-hidden md:grid md:grid-cols-2">
            {/* Receipt Image - Full width on mobile, left column on desktop */}
            <div className="relative min-h-[50vh] md:min-h-0 md:h-full md:overflow-hidden bg-muted/30">
              <ReceiptImage imageUrl={receipt.imageUrl} />
            </div>

            {/* Receipt Details - Flows below image on mobile, right column on desktop */}
            <div className="flex flex-col md:h-full md:overflow-hidden">
              {/* Header Section - Fixed on desktop, scrolls on mobile */}
              <div className="shrink-0 px-4 pt-4 pb-3 border-b sm:px-6 sm:pt-6 sm:pb-4 md:border-t">
                <ReceiptHeader
                  receipt={receipt}
                  household={household}
                  isLoadingPermissions={isLoadingPermissions}
                  canModifyReceipt={canModifyReceipt}
                  isReceiptOwner={isReceiptOwner}
                  onDeleted={() => onOpenChange(false)}
                  onRetrySuccess={handleRetrySuccess}
                />
              </div>

              {/* Scrollable Content Section - All details and items */}
              <div className="flex-1 md:overflow-y-auto px-4 py-3 space-y-3 sm:px-6 sm:py-4 sm:space-y-4\">
                <LinkedSubscription subscription={receipt.linkedSubscription} />

                <ReceiptBusinessExpenseInfo receipt={receipt} />

                <ReceiptBusinessDetails ocrData={ocr} />

                {!isSubscribed && (
                  <SubscriptionUpsell
                    title="Upgrade to Premium"
                    description="Subscribe to unlock detailed receipt information including:"
                    features={[
                      'Itemized purchase details',
                      'Service information (table, server, etc.)',
                      'Loyalty program details',
                      'Item spending analysis',
                    ]}
                  />
                )}

                {isSubscribed && (
                  <>
                    {(ocr?.phoneNumber || ocr?.website || ocr?.vatNumber) && <Separator />}

                    <ReceiptServiceDetails ocrData={ocr} />

                    {(ocr?.tableNumber || ocr?.serverName || ocr?.customerCount) && <Separator />}

                    <ReceiptLoyaltyDetails ocrData={ocr} />

                    {(ocr?.loyaltyNumber || ocr?.specialOffers) && <Separator />}

                    <ReceiptItemsList
                      items={receipt.items ?? []}
                      currency={receipt.currency ?? 'USD'}
                      onAnalyzeItem={(itemName) => {
                        setSelectedItemForAnalysis(itemName);
                        setShowItemAnalysis(true);
                      }}
                    />
                  </>
                )}
              </div>

              {/* Financial Breakdown - Footer, scrolls on mobile, fixed on desktop */}
              <div className="shrink-0 border-t mb-4 md:mb-0">
                <ReceiptFinancialBreakdown receipt={receipt} />
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>

      {/* Item Analysis Dialog */}
      {selectedItemForAnalysis && (
        <ItemAnalysisDialog
          itemName={selectedItemForAnalysis}
          open={showItemAnalysis}
          onOpenChange={(open) => {
            setShowItemAnalysis(open);
            if (!open) {
              setSelectedItemForAnalysis(null);
            }
          }}
          householdId={receipt.householdId ?? undefined}
        />
      )}
    </Dialog>
  );
}
