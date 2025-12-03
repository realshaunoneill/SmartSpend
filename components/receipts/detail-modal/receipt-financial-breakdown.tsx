"use client"

import { CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ReceiptFinancialBreakdownProps {
  receipt: any
}

export function ReceiptFinancialBreakdown({ receipt }: ReceiptFinancialBreakdownProps) {
  return (
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
  )
}
