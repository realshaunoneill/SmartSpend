"use client"

import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
          className="p-0 overflow-hidden border-0"
          showCloseButton={false}
          style={{
            maxWidth: "1200px",
            width: "90vw",
            maxHeight: "90vh",
            height: "90vh",
          }}
        >
        <VisuallyHidden>
          <DialogTitle>Receipt Details - {receipt.merchantName}</DialogTitle>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background dark:hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex w-full h-full">
          {/* Left Column - Receipt Image */}
          <ReceiptImage imageUrl={receipt.imageUrl} />

          {/* Right Column - Receipt Details */}
          <div className="w-[55%] shrink-0 flex flex-col h-full">
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-8 pb-4 space-y-6">
                <ReceiptHeader
                  receipt={receipt}
                  household={household}
                  isLoadingPermissions={isLoadingPermissions}
                  canModifyReceipt={canModifyReceipt}
                  isReceiptOwner={isReceiptOwner}
                  onDeleted={() => onOpenChange(false)}
                />

                <Separator />

                <ReceiptBusinessDetails ocrData={receipt.ocrData} />

                <ReceiptServiceDetails ocrData={receipt.ocrData} />

                <ReceiptLoyaltyDetails ocrData={receipt.ocrData} />

                <ReceiptItemsList
                  items={receipt.items}
                  currency={receipt.currency}
                  onAnalyzeItem={(itemName) => {
                    setSelectedItemForAnalysis(itemName)
                    setShowItemAnalysis(true)
                  }}
                />
              </div>
            </ScrollArea>

            {/* Enhanced Financial Breakdown - Sticky at bottom */}
            <ReceiptFinancialBreakdown receipt={receipt} />
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
