"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { QuickStats } from "@/components/quick-stats"
import { SpendingSummary } from "@/components/spending-summary"
import { SpendingChart } from "@/components/spending-chart"
import { ReceiptList } from "@/components/receipt-list"
import { HouseholdSelector } from "@/components/household-selector"
import { useUser } from "@clerk/nextjs"
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats"
import { useHouseholds } from "@/lib/hooks/use-households"

export default function DashboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()
  const { isLoaded, user } = useUser()
  
  const { data: households = [] } = useHouseholds()
  
  // Determine view mode based on selection
  const isPersonalOnly = selectedHouseholdId === "personal"
  const actualHouseholdId = isPersonalOnly ? undefined : selectedHouseholdId
  
  const { stats, isLoading: statsLoading } = useDashboardStats(actualHouseholdId, isPersonalOnly)

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // User will be redirected by middleware if not authenticated
  if (!user) {
    return null
  }

  // Show loading state while stats are loading
  if (statsLoading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-7xl space-y-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">Track your spending and manage your receipts</p>
            </div>
          </div>
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  const quickStats = stats ? {
    totalReceipts: stats.totalReceipts,
    totalTransactions: stats.totalReceipts, // Same as receipts for now
    avgSpending: stats.avgSpending,
    topCategory: stats.topCategory,
  } : {
    totalReceipts: 0,
    totalTransactions: 0,
    avgSpending: 0,
    topCategory: "No data",
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Track your spending and manage your receipts</p>
          </div>
          
          <div className="flex items-center gap-4">
            <HouseholdSelector
              households={[
                { id: "", name: "All Receipts" },
                { id: "personal", name: "Personal Only" },
                ...households
              ]}
              selectedHouseholdId={selectedHouseholdId || ""}
              onSelect={(id) => setSelectedHouseholdId(id || undefined)}
            />
          </div>
        </div>

        <QuickStats stats={quickStats} />

        <div className="grid gap-8 lg:grid-cols-2">
          <SpendingSummary 
            period={period} 
            onPeriodChange={setPeriod} 
            householdId={actualHouseholdId} 
            personalOnly={isPersonalOnly} 
          />
          <SpendingChart 
            period={period} 
            householdId={actualHouseholdId} 
            personalOnly={isPersonalOnly} 
          />
        </div>

        {stats?.recentReceipts && stats.recentReceipts.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Recent Receipts</h2>
            <ReceiptList receipts={stats.recentReceipts} />
          </div>
        )}
        
        {(!stats || stats.totalReceipts === 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No receipts found. Start by uploading your first receipt!</p>
            <a 
              href="/receipts" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Upload Receipt
            </a>
          </div>
        )}
      </main>
    </>
  )
}
