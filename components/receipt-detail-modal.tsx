"use client"

import {
  Store,
  Calendar,
  CreditCard,
  MapPin,
  Receipt as ReceiptIcon,
  Hash,
  ShoppingBag,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
  if (!receipt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 overflow-hidden border-0"
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
        <div className="flex h-full w-full">
          {/* Left Column - Receipt Image */}
          <div className="w-[45%] p-8 flex items-center justify-center border-r overflow-auto">
            {receipt.imageUrl ? (
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                <ReceiptIcon className="h-24 w-24 mb-4 opacity-20" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>

          {/* Right Column - Receipt Details */}
          <ScrollArea className="w-[55%] shrink-0">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {receipt.merchantName || "Unknown Merchant"}
                      </h2>
                      {receipt.location && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {receipt.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {receipt.transactionDate ||
                      new Date(receipt.createdAt).toLocaleDateString()}
                  </Badge>
                  {receipt.paymentMethod && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      <span className="capitalize">
                        {receipt.paymentMethod.replace("_", " ")}
                      </span>
                    </Badge>
                  )}
                  {receipt.receiptNumber && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {receipt.receiptNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Line Items */}
              {receipt.items && receipt.items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <ShoppingBag className="h-4 w-4" />
                    Items ({receipt.items.length})
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                    {receipt.items.map((item: any, index: number) => {
                      const quantity = parseFloat(item.quantity) || 1;
                      const totalPrice = parseFloat(item.price) || 0;
                      const unitPrice = quantity > 1 ? totalPrice / quantity : null;

                      return (
                        <div
                          key={index}
                          className="flex justify-between items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">
                              {item.name}
                            </p>
                            {item.quantity && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Qty: {item.quantity}
                                {unitPrice && (
                                  <span className="ml-2">
                                    @ {receipt.currency} {unitPrice.toFixed(2)} each
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {item.price && (
                            <p className="font-semibold text-sm whitespace-nowrap">
                              {receipt.currency} {item.price}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-3">
                <div className="space-y-2">
                  {receipt.subtotal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {receipt.currency} {receipt.subtotal}
                      </span>
                    </div>
                  )}

                  {receipt.tax && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">
                        {receipt.currency} {receipt.tax}
                      </span>
                    </div>
                  )}

                  {receipt.serviceCharge && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Charge</span>
                      <span className="font-medium">
                        {receipt.currency} {receipt.serviceCharge}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {receipt.currency} {receipt.totalAmount}
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
