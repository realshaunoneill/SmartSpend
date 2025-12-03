"use client"

import { Store, MapPin, Info, Calendar, Clock, CreditCard, Hash, Receipt as ReceiptIcon, Tag, Building2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReceiptAssignmentDialog } from "@/components/receipts/receipt-assignment-dialog"
import { DeleteReceiptButton } from "./delete-receipt-button"
import { formatCategory, capitalizeText } from "@/lib/utils/format-category"

interface ReceiptHeaderProps {
  receipt: any
  household: any
  isLoadingPermissions: boolean
  canModifyReceipt: boolean
  isReceiptOwner: boolean
  onDeleted: () => void
}

export function ReceiptHeader({
  receipt,
  household,
  isLoadingPermissions,
  canModifyReceipt,
  isReceiptOwner,
  onDeleted,
}: ReceiptHeaderProps) {
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
                onDeleted={onDeleted}
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
  )
}
