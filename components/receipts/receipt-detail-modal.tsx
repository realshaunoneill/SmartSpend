"use client"

import { X, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ItemAnalysisDialog } from "@/components/insights/item-analysis-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ReceiptHeader } from "./detail-modal/receipt-header"
import { ReceiptBusinessDetails } from "./detail-modal/receipt-business-details"
import { ReceiptServiceDetails } from "./detail-modal/receipt-service-details"
import { ReceiptLoyaltyDetails } from "./detail-modal/receipt-loyalty-details"
import { ReceiptItemsList } from "./detail-modal/receipt-items-list"
import { ReceiptFinancialBreakdown } from "./detail-modal/receipt-financial-breakdown"
import { ReceiptImage } from "./detail-modal/receipt-image"

interface ReceiptDetailModalProps {
  receipt: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptDetailModal({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailModalProps) {
  const [selectedItemForAnalysis, setSelectedItemForAnalysis] = useState<string | null>(null);
  const [showItemAnalysis, setShowItemAnalysis] = useState(false);
  const [hideImageOnMobile, setHideImageOnMobile] = useState(false);

  // Fetch household name and user's role if receipt is assigned to one
  const { data: household } = useQuery({
    queryKey: ["household", receipt?.householdId],
    queryFn: async () => {
      if (!receipt?.householdId) return null;
      
      const response = await fetch(`/api/households/${receipt.householdId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!receipt?.householdId && open,
  });

  // Get current user data to check permissions
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const response = await fetch("/api/users/me");
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: open,
  });

  // Check if user can modify this receipt
  const canModifyReceipt = currentUser && receipt && (
    // User is the owner
    receipt.userId === currentUser.id ||
    // Or user is household admin (for removing from household only)
    (receipt.householdId && household?.members?.some((m: any) => 
      m.userId === currentUser.id && m.role === 'owner'
    ))
  );

  // Check if user is the receipt owner
  const isReceiptOwner = currentUser && receipt && receipt.userId === currentUser.id;
  
  // Check if we're still loading permissions
  const isLoadingPermissions = isLoadingUser || (receipt?.householdId && !household && open);

  if (!receipt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent 
          className="p-0 gap-0 h-[95vh]"
          style={{
            width: '90vw',
            maxWidth: '1400px',
            maxHeight: '95vh'
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

          <div className="grid md:grid-cols-2 h-full overflow-hidden">
            {/* Left Column - Receipt Image */}
            <div className={`relative ${hideImageOnMobile ? 'hidden md:block' : 'block'} overflow-auto bg-muted/30`}>
              <ReceiptImage imageUrl={receipt.imageUrl} />
            </div>

            {/* Right Column - Receipt Details */}
            <div className="flex flex-col h-full overflow-hidden">
              {/* Mobile toggle button */}
              <div className="md:hidden flex justify-end p-2 border-b">
                <button
                  onClick={() => setHideImageOnMobile(!hideImageOnMobile)}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-muted transition-colors"
                  aria-label={hideImageOnMobile ? 'Show receipt image' : 'Hide receipt image'}
                >
                  {hideImageOnMobile ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Show Image
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hide Image
                    </>
                  )}
                </button>
              </div>

              {/* Header Section */}
              <div className="px-6 pt-6 pb-4 border-b">
                <ReceiptHeader
                  receipt={receipt}
                  household={household}
                  isLoadingPermissions={isLoadingPermissions}
                  canModifyReceipt={canModifyReceipt}
                  isReceiptOwner={isReceiptOwner}
                  onDeleted={() => onOpenChange(false)}
                />
              </div>

              {/* Scrollable Details Section */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <ReceiptBusinessDetails ocrData={receipt.ocrData} />

                <Separator />

                <ReceiptServiceDetails ocrData={receipt.ocrData} />

                <Separator />

                <ReceiptLoyaltyDetails ocrData={receipt.ocrData} />

                <Separator />

                <ReceiptItemsList
                  items={receipt.items}
                  currency={receipt.currency}
                  onAnalyzeItem={(itemName) => {
                    setSelectedItemForAnalysis(itemName)
                    setShowItemAnalysis(true)
                  }}
                />
              </div>

              {/* Financial Breakdown - Sticky Footer */}
              <div className="border-t">
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
          householdId={receipt.householdId}
        />
      )}
    </Dialog>
  )
}
