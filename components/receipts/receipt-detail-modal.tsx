"use client"

import {
  Store,
  Calendar,
  CreditCard,
  MapPin,
  Receipt as ReceiptIcon,
  Hash,
  ShoppingBag,
  Users,
  Phone,
  Globe,
  Clock,
  Tag,
  Building2,
  Utensils,
  Gift,
  Percent,
  UserCheck,
  Info,
  X,
  ExternalLink,
  TrendingUp,
  Trash2,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ReceiptAssignmentDialog } from "@/components/receipts/receipt-assignment-dialog"
import { ItemAnalysisDialog } from "@/components/insights/item-analysis-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatCategory, capitalizeText } from "@/lib/utils/format-category"

interface ReceiptDetailModalProps {
  receipt: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DeleteReceiptButtonProps {
  receiptId: string
  onDeleted: () => void
}

function DeleteReceiptButton({ receiptId, onDeleted }: DeleteReceiptButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete receipt")
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["receipts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      queryClient.invalidateQueries({ queryKey: ["recent-receipts"] })
      queryClient.invalidateQueries({ queryKey: ["spending-trends"] })

      toast.success("Receipt deleted successfully")
      onDeleted()
    } catch (error) {
      console.error("Error deleting receipt:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete receipt")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this receipt? This action cannot be undone.
            The receipt will be removed from all households it's shared with.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Receipt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
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
          <div className="w-[45%] p-2 pt-8 flex items-start justify-center border-r overflow-auto h-full">
            {receipt.imageUrl ? (
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl drop-shadow-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                <ReceiptIcon className="h-24 w-24 mb-4 opacity-20" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>

          {/* Right Column - Receipt Details */}
          <div className="w-[55%] shrink-0 flex flex-col h-full">
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-8 pb-4 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          {receipt.merchantName || "Unknown Merchant"}
                        </h2>
                        {receipt.ocrData && Object.keys(receipt.ocrData).length > 5 && (
                          <Badge variant="default" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Enhanced
                          </Badge>
                        )}
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
                        {receipt.ocrData?.merchantType && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {capitalizeText(receipt.ocrData.merchantType)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Household Badge */}
                {household && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                      <Users className="h-3 w-3" />
                      Shared with {household.name}
                    </Badge>
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
                        currentHouseholdId={receipt.householdId}
                        isOwner={isReceiptOwner}
                        canRemoveOnly={!isReceiptOwner && receipt.householdId}
                      >
                        <Button variant="secondary" size="sm" className="flex-1">
                          <Users className="h-4 w-4 mr-2" />
                          {!isReceiptOwner && receipt.householdId 
                            ? "Remove from Household" 
                            : receipt.householdId 
                              ? "Change Household" 
                              : "Assign to Household"
                          }
                        </Button>
                      </ReceiptAssignmentDialog>
                      
                      {/* Delete Button - Only for receipt owner */}
                      {isReceiptOwner && (
                        <DeleteReceiptButton 
                          receiptId={receipt.id}
                          onDeleted={() => onOpenChange(false)}
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {receipt.transactionDate ||
                      new Date(receipt.createdAt).toLocaleDateString()}
                  </Badge>
                  {receipt.ocrData?.timeOfDay && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {receipt.ocrData.timeOfDay}
                    </Badge>
                  )}
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
                  {receipt.ocrData?.orderNumber && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ReceiptIcon className="h-3 w-3" />
                      Order: {receipt.ocrData.orderNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Business Details */}
              {(receipt.ocrData?.phoneNumber || receipt.ocrData?.website || receipt.ocrData?.vatNumber) && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Building2 className="h-4 w-4" />
                      Business Details
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {receipt.ocrData?.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{receipt.ocrData.phoneNumber}</span>
                        </div>
                      )}
                      {receipt.ocrData?.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={receipt.ocrData.website.startsWith('http') ? receipt.ocrData.website : `https://${receipt.ocrData.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 hover:underline transition-colors flex items-center gap-1"
                          >
                            {receipt.ocrData.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {receipt.ocrData?.vatNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span>VAT: {receipt.ocrData.vatNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Service Details */}
              {(receipt.ocrData?.tableNumber || receipt.ocrData?.serverName || receipt.ocrData?.customerCount) && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Utensils className="h-4 w-4" />
                      Service Details
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {receipt.ocrData?.tableNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span>Table {receipt.ocrData.tableNumber}</span>
                        </div>
                      )}
                      {receipt.ocrData?.serverName && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Server: {receipt.ocrData.serverName}</span>
                        </div>
                      )}
                      {receipt.ocrData?.customerCount && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Covers: {receipt.ocrData.customerCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Loyalty & Promotions */}
              {(receipt.ocrData?.loyaltyNumber || receipt.ocrData?.specialOffers) && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Gift className="h-4 w-4" />
                      Loyalty & Promotions
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {receipt.ocrData?.loyaltyNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>Member: {receipt.ocrData.loyaltyNumber}</span>
                        </div>
                      )}
                      {receipt.ocrData?.specialOffers && (
                        <div className="flex items-center gap-2 text-sm">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span>{receipt.ocrData.specialOffers}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Line Items */}
              {receipt.items && receipt.items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <ShoppingBag className="h-4 w-4" />
                    Items ({receipt.items.length})
                  </div>
                  <div className="space-y-1 pr-2">
                    {receipt.items.map((item: any, index: number) => {
                      const quantity = parseFloat(item.quantity) || 1;
                      const totalPrice = parseFloat(item.price) || 0;
                      const unitPrice = quantity > 1 ? totalPrice / quantity : null;
                      const hasModifiers = item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0;

                      return (
                        <div
                          key={index}
                          className="py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Left: Item details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <p className="font-medium text-sm wrap-break-word">
                                  {item.name}
                                </p>
                                {item.category && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                                    {capitalizeText(item.category)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                                {item.quantity && (
                                  <span className="whitespace-nowrap">Qty: {item.quantity}</span>
                                )}
                                {unitPrice && quantity > 1 && (
                                  <span className="whitespace-nowrap">@ {receipt.currency} {unitPrice.toFixed(2)} each</span>
                                )}
                                {item.description && (
                                  <span className="italic wrap-break-word">{item.description}</span>
                                )}
                              </div>
                            </div>

                            {/* Right: Price and button */}
                            <div className="flex items-center gap-2 shrink-0">
                              {item.price && (
                                <p className="font-semibold text-sm whitespace-nowrap">
                                  {receipt.currency} {item.price}
                                </p>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setSelectedItemForAnalysis(item.name);
                                  setShowItemAnalysis(true);
                                }}
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Analyze
                              </Button>
                            </div>
                          </div>

                          {/* Modifiers/Sub-items */}
                          {hasModifiers && (
                            <div className="mt-2 ml-4 space-y-1 border-l-2 border-muted pl-3">
                              {item.modifiers.map((modifier: any, modIndex: number) => {
                                const isDiscount = modifier.type === 'discount' || modifier.price < 0;
                                const isDeposit = modifier.type === 'deposit';
                                const isFee = modifier.type === 'fee';
                                
                                return (
                                  <div
                                    key={modIndex}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {isDiscount && <Percent className="h-3 w-3 text-green-600" />}
                                      {isDeposit && <Tag className="h-3 w-3 text-blue-600" />}
                                      {isFee && <Info className="h-3 w-3 text-orange-600" />}
                                      <span className={`${isDiscount ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {modifier.name}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[10px] px-1 py-0 h-4 ${
                                          isDiscount ? 'border-green-600/30 text-green-600' :
                                          isDeposit ? 'border-blue-600/30 text-blue-600' :
                                          isFee ? 'border-orange-600/30 text-orange-600' :
                                          'border-muted-foreground/30'
                                        }`}
                                      >
                                        {capitalizeText(modifier.type)}
                                      </Badge>
                                    </div>
                                    <span className={`font-medium ${isDiscount ? 'text-green-600' : ''}`}>
                                      {modifier.price >= 0 ? '+' : ''}{receipt.currency} {Math.abs(modifier.price).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              </div>
            </ScrollArea>

            {/* Enhanced Financial Breakdown - Sticky at bottom */}
            <div className="border-t bg-background p-6 space-y-4 shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <CreditCard className="h-4 w-4" />
                Financial Breakdown
              </div>
              
              {/* Base Amount Section */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                {receipt.subtotal && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-sm font-semibold">
                      {receipt.currency} {receipt.subtotal}
                    </span>
                  </div>
                )}

                {/* Charges Section */}
                {(receipt.tax || receipt.serviceCharge || receipt.ocrData?.tips || receipt.ocrData?.deliveryFee || receipt.ocrData?.packagingFee) && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      {receipt.tax && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tax</span>
                          <span className="text-sm font-medium">
                            +{receipt.currency} {receipt.tax}
                          </span>
                        </div>
                      )}

                      {receipt.serviceCharge && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Service Charge</span>
                          <span className="text-sm font-medium">
                            +{receipt.currency} {receipt.serviceCharge}
                          </span>
                        </div>
                      )}

                      {receipt.ocrData?.tips && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tips</span>
                          <span className="text-sm font-medium">
                            +{receipt.currency} {receipt.ocrData.tips}
                          </span>
                        </div>
                      )}

                      {receipt.ocrData?.deliveryFee && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Delivery Fee</span>
                          <span className="text-sm font-medium">
                            +{receipt.currency} {receipt.ocrData.deliveryFee}
                          </span>
                        </div>
                      )}

                      {receipt.ocrData?.packagingFee && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Packaging Fee</span>
                          <span className="text-sm font-medium">
                            +{receipt.currency} {receipt.ocrData.packagingFee}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Discounts Section */}
                {receipt.ocrData?.discount && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Discount</span>
                      <span className="text-sm font-medium text-green-600">
                        -{receipt.currency} {receipt.ocrData.discount}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Total Section */}
              <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {receipt.currency} {receipt.totalAmount}
                  </span>
                </div>
              </div>
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
