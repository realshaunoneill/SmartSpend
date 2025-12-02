"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"
import { ReceiptList } from "@/components/receipts/receipt-list"
import { ReceiptListSkeleton } from "@/components/receipts/receipt-list-skeleton"
import { HouseholdSelector } from "@/components/households/household-selector"
import { Pagination } from "@/components/layout/pagination"
import { ReceiptDetailModal } from "@/components/receipts/receipt-detail-modal"
import { SubscriptionGate } from "@/components/subscriptions/subscription-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser as useClerkUser } from "@clerk/nextjs"
import { useUser } from "@/lib/hooks/use-user"
import { useReceipts, useRecentReceipts } from "@/lib/hooks/use-receipts"
import { useHouseholds } from "@/lib/hooks/use-households"
import { formatCategory } from "@/lib/utils/format-category"

export default function ReceiptsPage() {
  const { user: clerkUser } = useClerkUser()
  const { user } = useUser()
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const pageSize = 12
  
  const { data: households = [] } = useHouseholds()
  
  // Get recent receipts for the top section
  const { receipts: recentReceipts, isLoading: recentLoading, refetch: refetchRecent } = useRecentReceipts(selectedHouseholdId, 5)
  
  // Get paginated receipts for the main list
  const { receipts: allReceipts, pagination, isLoading: allLoading, error, refetch: refetchAll } = useReceipts(selectedHouseholdId, currentPage, pageSize)

  // Reset page when household changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedHouseholdId])

  const handleUploadComplete = () => {
    refetchRecent()
    refetchAll()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleReceiptClick = (receipt: any) => {
    setSelectedReceipt(receipt)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedReceipt(null)
  }

  // Clerk middleware ensures user is authenticated
  if (!clerkUser) return null

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Receipts
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload and manage your receipts with automatic scanning
            </p>
          </div>
          
          {households.length > 0 && (
            <div className="flex items-center gap-4">
              <HouseholdSelector
                households={[
                  { id: "", name: "Personal Receipts" },
                  ...households
                ]}
                selectedHouseholdId={selectedHouseholdId || ""}
                onSelect={(id) => setSelectedHouseholdId(id || undefined)}
              />
            </div>
          )}
        </div>

        {/* Upload and Recent Receipts Section */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SubscriptionGate feature="upload">
              <ReceiptUpload
                clerkId={clerkUser.id}
                userEmail={clerkUser.emailAddresses[0]?.emailAddress || ""}
                householdId={selectedHouseholdId}
                onUploadComplete={handleUploadComplete}
              />
            </SubscriptionGate>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Receipts</CardTitle>
                <CardDescription>Your 5 most recent receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {recentLoading ? (
                  <ReceiptListSkeleton />
                ) : error ? (
                  <div className="text-center p-8 text-destructive">
                    Failed to load recent receipts
                  </div>
                ) : recentReceipts.length > 0 ? (
                  <ReceiptList receipts={recentReceipts} onReceiptClick={handleReceiptClick} />
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    No receipts found. Upload your first receipt to get started!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Receipts Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">All Receipts</h2>
              <p className="text-muted-foreground">
                {pagination ? `${pagination.total} total receipts` : "Loading..."}
              </p>
            </div>
          </div>

          {allLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-12 text-destructive">
              Failed to load receipts
            </div>
          ) : allReceipts.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allReceipts.map((receipt) => (
                  <Card 
                    key={receipt.id} 
                    className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:border-primary/20 active:scale-[0.98]"
                    onClick={() => handleReceiptClick(receipt)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm truncate">
                            {receipt.merchantName || "Unknown Merchant"}
                          </h3>
                          <span className="text-sm font-medium text-green-600">
                            ${parseFloat(receipt.totalAmount || "0").toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {receipt.transactionDate 
                            ? new Date(receipt.transactionDate).toLocaleDateString()
                            : new Date(receipt.createdAt).toLocaleDateString()
                          }
                        </div>
                        {receipt.category && (
                          <div className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {formatCategory(receipt.category)}
                          </div>
                        )}
                        {receipt.imageUrl && (
                          <div className="aspect-3/4 overflow-hidden rounded-md bg-muted">
                            <img
                              src={receipt.imageUrl}
                              alt="Receipt"
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center pt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                📄
              </div>
              <h3 className="text-lg font-semibold mb-2">No receipts found</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first receipt to get started tracking your expenses.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal
        receipt={selectedReceipt}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  )
}
