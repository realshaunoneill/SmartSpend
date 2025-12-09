"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Navigation } from "@/components/layout/navigation"
import { ReceiptBatchUpload } from "@/components/receipts/receipt-batch-upload"
import { ReceiptList } from "@/components/receipts/receipt-list"
import { ReceiptListSkeleton } from "@/components/receipts/receipt-list-skeleton"
import { HouseholdSelector } from "@/components/households/household-selector"
import { Pagination } from "@/components/layout/pagination"
import { ReceiptDetailModal } from "@/components/receipts/receipt-detail-modal"
import { ReceiptSearchFilters, ReceiptFilters } from "@/components/receipts/receipt-search-filters"
import { SubscriptionGate } from "@/components/subscriptions/subscription-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Store, Tag, ShoppingCart } from "lucide-react"
import { useUser as useClerkUser } from "@clerk/nextjs"
import { useUser } from "@/lib/hooks/use-user"
import { useReceipts, useRecentReceipts } from "@/lib/hooks/use-receipts"
import { useHouseholds } from "@/lib/hooks/use-households"
import { formatCategory } from "@/lib/utils/format-category"

// Helper function to determine why a receipt matched the search
function getSearchMatchReason(receipt: any, searchTerm: string): { type: string; icon: any; label: string } | null {
  if (!searchTerm) return null;
  
  const search = searchTerm.toLowerCase();
  
  // Check merchant name
  if (receipt.merchantName?.toLowerCase().includes(search)) {
    return { type: "merchant", icon: Store, label: `Merchant: ${receipt.merchantName}` };
  }
  
  // Check category
  if (receipt.category?.toLowerCase().includes(search)) {
    return { type: "category", icon: Tag, label: `Category: ${formatCategory(receipt.category)}` };
  }
  
  // Check line items
  if (receipt.items && Array.isArray(receipt.items)) {
    const matchingItems = receipt.items.filter((item: any) => 
      item.name?.toLowerCase().includes(search)
    );
    if (matchingItems.length > 0) {
      return { 
        type: "item", 
        icon: ShoppingCart, 
        label: `Item: ${matchingItems[0].name}${matchingItems.length > 1 ? ` +${matchingItems.length - 1} more` : ''}` 
      };
    }
  }
  
  return null;
}

export default function ReceiptsPage() {
  const { user: clerkUser } = useClerkUser()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<ReceiptFilters>({
    sortBy: "date",
    sortOrder: "desc",
  })
  const pageSize = 12
  
  const { data: households = [] } = useHouseholds()
  
  // Get recent receipts for the top section
  const { receipts: recentReceipts, isLoading: recentLoading, refetch: refetchRecent } = useRecentReceipts(selectedHouseholdId, 5)
  
  // Get paginated receipts for the main list
  const { receipts: allReceipts, pagination, isLoading: allLoading, error, refetch: refetchAll } = useReceipts(
    selectedHouseholdId, 
    currentPage, 
    pageSize,
    filters
  )

  // Reset page when household or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedHouseholdId, filters])

  // Handle selected query parameter from URL
  useEffect(() => {
    const selectedId = searchParams.get('selected')
    if (selectedId) {
      // Find the receipt in either recent or all receipts
      const receiptsToSearch = [...(recentReceipts || []), ...(allReceipts || [])]
      const receipt = receiptsToSearch.find(r => r.id === selectedId)
      
      if (receipt) {
        setSelectedReceipt(receipt)
        setIsModalOpen(true)
      } else {
        // Receipt not yet loaded, fetch it using queryClient
        queryClient.fetchQuery({
          queryKey: ['receipt', selectedId],
          queryFn: async () => {
            const res = await fetch(`/api/receipts/${selectedId}`)
            if (!res.ok) throw new Error('Receipt not found')
            return res.json()
          },
          staleTime: 5 * 60 * 1000,
        }).then(receipt => {
          setSelectedReceipt(receipt)
          setIsModalOpen(true)
        }).catch(err => {
          console.error('Failed to fetch receipt:', err)
        })
      }
    }
  }, [searchParams, recentReceipts, allReceipts, queryClient])

  // Prefetch subscription data for all receipts when they load
  useEffect(() => {
    const prefetchSubscriptions = async () => {
      const receiptsToCheck = [...(recentReceipts || []), ...(allReceipts || [])]
      
      for (const receipt of receiptsToCheck) {
        // Prefetch subscription data for each receipt
        queryClient.prefetchQuery({
          queryKey: ['receipt-subscription', receipt.id],
          queryFn: async () => {
            const res = await fetch(`/api/receipts/${receipt.id}/subscription`)
            if (!res.ok) {
              if (res.status === 404) return null
              throw new Error('Failed to fetch subscription link')
            }
            return res.json()
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        })
      }
    }

    if (recentReceipts || allReceipts) {
      prefetchSubscriptions()
    }
  }, [recentReceipts, allReceipts, queryClient])

  const handleUploadComplete = () => {
    refetchRecent()
    refetchAll()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFiltersChange = (newFilters: ReceiptFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      sortBy: "date",
      sortOrder: "desc",
    })
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
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Receipts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SubscriptionGate feature="upload">
              <ReceiptBatchUpload
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

          {/* Search and Filters */}
          <ReceiptSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

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
                {allReceipts.map((receipt) => {
                  const isFailed = receipt.processingStatus === 'failed';
                  const isProcessing = receipt.processingStatus === 'processing';
                  const matchReason = getSearchMatchReason(receipt, filters.search || "");
                  
                  return (
                    <Card 
                      key={receipt.id} 
                      className={`overflow-hidden transition-all duration-200 ${
                        isFailed 
                          ? 'bg-destructive/5 border-destructive/20' 
                          : 'cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:border-primary/20 active:scale-[0.98]'
                      }`}
                      onClick={() => !isFailed && handleReceiptClick(receipt)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {/* Search Match Indicator */}
                          {matchReason && (
                            <div className="mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5">
                              <matchReason.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-primary truncate">
                                  {matchReason.label}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm truncate">
                              {receipt.merchantName || "Unknown Merchant"}
                            </h3>
                            {!isFailed && (
                              <span className="text-sm font-medium text-green-600">
                                ${parseFloat(receipt.totalAmount || "0").toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {receipt.transactionDate 
                              ? new Date(receipt.transactionDate).toLocaleDateString()
                              : new Date(receipt.createdAt).toLocaleDateString()
                            }
                          </div>
                          {receipt.category && !isFailed && (
                            <div className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {formatCategory(receipt.category)}
                            </div>
                          )}
                          {receipt.imageUrl && (
                            <div className="relative aspect-3/4 overflow-hidden rounded-md bg-muted">
                              <img
                                src={receipt.imageUrl}
                                alt="Receipt"
                                className={`h-full w-full object-cover transition-transform ${
                                  isFailed ? 'blur-sm' : 'hover:scale-105'
                                }`}
                              />
                              {isFailed && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20 p-4">
                                  <div className="text-center space-y-2">
                                    <div className="text-xs font-medium text-destructive">
                                      Processing Failed
                                    </div>
                                    {receipt.processingError && (
                                      <div className="text-xs text-destructive/80">
                                        {receipt.processingError}
                                      </div>
                                    )}
                                    <Button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const response = await fetch(`/api/receipts/${receipt.id}/retry`, {
                                            method: 'POST',
                                          });
                                          if (response.ok) {
                                            refetchAll();
                                            refetchRecent();
                                          }
                                        } catch (error) {
                                          console.error('Retry failed:', error);
                                        }
                                      }}
                                      size="sm"
                                      variant="destructive"
                                      className="mt-2"
                                    >
                                      Retry Processing
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {isProcessing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                  <div className="text-center space-y-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                                    <div className="text-xs font-medium text-primary">
                                      Processing...
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
