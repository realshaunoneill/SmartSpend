"use client"

import { useState } from "react"
import { ReceiptIcon, Calendar, Store, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReceiptDetailModal } from "@/components/receipt-detail-modal"
import type { Receipt } from "@/lib/types"

interface ReceiptListProps {
  receipts: Receipt[]
}

const categoryColors: Record<string, string> = {
  groceries: "bg-green-500/10 text-green-700 dark:text-green-400",
  dining: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  transportation: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  shopping: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  utilities: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  entertainment: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  healthcare: "bg-red-500/10 text-red-700 dark:text-red-400",
  travel: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

export function ReceiptList({ receipts }: ReceiptListProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleReceiptClick = (receipt: any) => {
    setSelectedReceipt(receipt)
    setModalOpen(true)
  }

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
                className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 cursor-pointer"
              >
                {/* Receipt Image Thumbnail */}
                <div className="shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
                    {(receipt as any).imageUrl ? (
                      <img
                        src={(receipt as any).imageUrl || "/placeholder.svg"}
                        alt={`Receipt from ${(receipt as any).merchantName || "merchant"}`}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {(receipt as any).merchantName || "Unknown Merchant"}
                      </span>
                    </div>
                    <span className="whitespace-nowrap text-lg font-bold text-foreground">
                      {(receipt as any).currency || "$"} {(receipt as any).totalAmount || "0.00"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {(receipt as any).transactionDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {(receipt as any).transactionDate}
                      </div>
                    )}
                    {(receipt as any).category && (
                      <Badge variant="secondary" className={categoryColors[(receipt as any).category] || categoryColors.other}>
                        {(receipt as any).category}
                      </Badge>
                    )}
                    {(receipt as any).paymentMethod && (
                      <span className="capitalize">{(receipt as any).paymentMethod.replace("_", " ")}</span>
                    )}
                    {(receipt as any).items && (receipt as any).items.length > 0 && (
                      <span>{(receipt as any).items.length} items</span>
                    )}
                    {(receipt as any).householdId && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      <ReceiptDetailModal
        receipt={selectedReceipt}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
