"use client"

import { CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ReceiptFinancialBreakdownProps {
  receipt: any
}

export function ReceiptFinancialBreakdown({ receipt }: ReceiptFinancialBreakdownProps) {
  const hasCharges = receipt.tax || receipt.serviceCharge || receipt.ocrData?.tips || receipt.ocrData?.deliveryFee || receipt.ocrData?.packagingFee
  const hasDiscount = receipt.ocrData?.discount
  const hasDetails = receipt.subtotal || hasCharges || hasDiscount

  return (
    <div className="bg-background p-4 space-y-3 shrink-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <CreditCard className="h-3.5 w-3.5" />
        Financial Breakdown
      </div>
      
      {/* Only show detailed breakdown if there are details */}
      {hasDetails && (
        <div className="space-y-2 p-3 rounded-lg bg-muted/30">
          {receipt.subtotal && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Subtotal</span>
              <span className="text-sm font-semibold">
                {receipt.currency} {receipt.subtotal}
              </span>
            </div>
          )}

          {/* Charges Section */}
          {hasCharges && (
            <>
              {receipt.subtotal && <Separator className="my-1.5" />}
              <div className="space-y-1.5">
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
          {hasDiscount && (
            <>
              <Separator className="my-1.5" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Discount</span>
                <span className="text-sm font-medium text-green-600">
                  -{receipt.currency} {receipt.ocrData.discount}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Total Section - Always show */}
      <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-primary">Total Amount</span>
          <span className="text-xl font-bold text-primary">
            {receipt.currency} {receipt.totalAmount}
          </span>
        </div>
      </div>
    </div>
  )
}
