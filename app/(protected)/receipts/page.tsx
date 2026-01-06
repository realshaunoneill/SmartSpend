'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Navigation } from '@/components/layout/navigation';
import { ReceiptBatchUpload } from '@/components/receipts/receipt-batch-upload';
import { ReceiptList } from '@/components/receipts/receipt-list';
import { ReceiptListSkeleton } from '@/components/receipts/receipt-list-skeleton';
import { HouseholdSelector } from '@/components/households/household-selector';
import { Pagination } from '@/components/layout/pagination';
import { ReceiptDetailModal } from '@/components/receipts/receipt-detail-modal';
import { ReceiptSearchFilters, type ReceiptFilters } from '@/components/receipts/receipt-search-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Upload, Camera, Scan, FileText, Crown, Loader2, Sparkles } from 'lucide-react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { useUser } from '@/lib/hooks/use-user';
import { useReceipts, useRecentReceipts } from '@/lib/hooks/use-receipts';
import { useHouseholds } from '@/lib/hooks/use-households';
import { ReceiptTimeline } from '@/components/receipts/receipt-timeline';
import { toast } from 'sonner';
import type { ReceiptWithItems } from '@/lib/types/api-responses';
import type { Receipt } from '@/lib/db/schema';

const trialDays = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS ? parseInt(process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS) : 0;

function ReceiptsPageContent() {
  const { user: clerkUser } = useClerkUser();
  const { isSubscribed } = useUser();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ReceiptFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const pageSize = 12;

  const { data: households = [] } = useHouseholds();

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        if (trialDays > 0) {
          toast.success(`Starting your ${trialDays}-day free trial...`);
        }
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error('Failed to start checkout. Please try again.');
    },
  });

  // Get recent receipts for the top section
  const { receipts: recentReceipts, isLoading: recentLoading, refetch: refetchRecent } = useRecentReceipts(selectedHouseholdId, 5);

  // Get paginated receipts for the main list
  const { receipts: allReceipts, pagination, isLoading: allLoading, error, refetch: refetchAll } = useReceipts(
    selectedHouseholdId,
    currentPage,
    pageSize,
    filters,
  );

  // Reset page when household or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedHouseholdId, filters]);

  // Handle selected or receiptId query parameter from URL
  useEffect(() => {
    const selectedId = searchParams.get('selected') || searchParams.get('receiptId');
    if (selectedId) {
      // Find the receipt in either recent or all receipts
      const receiptsToSearch = [...(recentReceipts || []), ...(allReceipts || [])];
      const receipt = receiptsToSearch.find(r => r.id === selectedId);

      if (receipt) {
        setSelectedReceipt(receipt);
        setIsModalOpen(true);
      } else {
        // Receipt not yet loaded, fetch it using queryClient
        queryClient.fetchQuery({
          queryKey: ['receipt', selectedId],
          queryFn: async () => {
            const res = await fetch(`/api/receipts/${selectedId}`);
            if (!res.ok) throw new Error('Receipt not found');
            return res.json();
          },
          staleTime: 5 * 60 * 1000,
        }).then(receipt => {
          setSelectedReceipt(receipt);
          setIsModalOpen(true);
        }).catch(err => {
          console.error('Failed to fetch receipt:', err);
        });
      }
    }
  }, [searchParams, recentReceipts, allReceipts, queryClient]);

  // Prefetch subscription data for all receipts when they load
  useEffect(() => {
    const prefetchSubscriptions = async () => {
      const receiptsToCheck = [...(recentReceipts || []), ...(allReceipts || [])];

      for (const receipt of receiptsToCheck) {
        // Prefetch subscription data for each receipt
        queryClient.prefetchQuery({
          queryKey: ['receipt-subscription', receipt.id],
          queryFn: async () => {
            const res = await fetch(`/api/receipts/${receipt.id}/subscription`);
            if (!res.ok) {
              if (res.status === 404) return null;
              throw new Error('Failed to fetch subscription link');
            }
            return res.json();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    };

    if (recentReceipts || allReceipts) {
      prefetchSubscriptions();
    }
  }, [recentReceipts, allReceipts, queryClient]);

  const handleUploadComplete = () => {
    refetchRecent();
    refetchAll();
  };

  const handleRetry = () => {
    refetchRecent();
    refetchAll();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters: ReceiptFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const handleReceiptClick = (receipt: ReceiptWithItems) => {
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReceipt(null);
  };

  // Clerk middleware ensures user is authenticated
  if (!clerkUser) return null;

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
                  { id: '', name: 'Personal Receipts' },
                  ...households,
                ]}
                selectedHouseholdId={selectedHouseholdId || ''}
                onSelect={(id) => setSelectedHouseholdId(id || undefined)}
              />
            </div>
          )}
        </div>

        {/* Upload and Recent Receipts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {isSubscribed ? (
              <ReceiptBatchUpload
                userEmail={clerkUser.emailAddresses[0]?.emailAddress || ''}
                householdId={selectedHouseholdId}
                onUploadComplete={handleUploadComplete}
              />
            ) : (
              <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 via-transparent to-primary/5">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-xl text-foreground">Unlock Receipt Uploads</CardTitle>
                    {trialDays > 0 && (
                      <Badge variant="default" className="text-xs">
                        {trialDays}-day trial
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    Upload receipts and let AI extract all the details automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Camera className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Photo upload</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Scan className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">AI scanning</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Auto extraction</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Sparkles className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Smart categorization</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full gap-2"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        {trialDays > 0 ? 'Start Free Trial' : 'Upgrade Now'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {trialDays > 0 ? 'Cancel anytime during trial' : 'Cancel anytime'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-4">
            {recentLoading ? (
              <ReceiptListSkeleton />
            ) : error ? (
              <Card>
                <CardContent className="text-center p-8 text-destructive">
                  Failed to load recent receipts
                </CardContent>
              </Card>
            ) : recentReceipts.length > 0 ? (
              <ReceiptList receipts={recentReceipts} onReceiptClick={handleReceiptClick} onRetry={handleRetry} />
            ) : (
              <Card>
                <CardContent className="text-center p-8 text-muted-foreground">
                  No receipts found. Upload your first receipt to get started!
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* All Receipts Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-muted-foreground" />
                Receipt Timeline
              </h2>
              <p className="text-muted-foreground mt-1">
                {pagination ? (
                  <>
                    <span className="font-medium">{pagination.total}</span> receipts organized by date
                  </>
                ) : (
                  'Loading your receipts...'
                )}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <ReceiptSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            totalResults={filters.search ? pagination?.total : undefined}
            isSearching={allLoading && !!filters.search}
            hasHouseholdFilter={!!selectedHouseholdId && households.length > 0}
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
              <ReceiptTimeline receipts={allReceipts} onReceiptClick={handleReceiptClick} />

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
          ) : filters.search ? (
            <div className="text-center p-12 border rounded-lg bg-muted/20">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                🔍
              </div>
              <h3 className="text-lg font-semibold mb-2">No matching receipts</h3>
              <p className="text-muted-foreground mb-4">
                No receipts found matching "<span className="font-medium">{filters.search}</span>"
                {selectedHouseholdId && !filters.searchAllHouseholds && (
                  <span className="block mt-1 text-sm">Try searching across all households</span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleFiltersChange({ ...filters, search: undefined })}
                >
                  Clear search
                </Button>
                {selectedHouseholdId && !filters.searchAllHouseholds && (
                  <Button
                    variant="secondary"
                    onClick={() => handleFiltersChange({ ...filters, searchAllHouseholds: true })}
                  >
                    Search all households
                  </Button>
                )}
              </div>
            </div>
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
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<ReceiptListSkeleton />}>
      <ReceiptsPageContent />
    </Suspense>
  );
}
