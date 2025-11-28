"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { QuickStats } from "@/components/quick-stats"
import { SpendingSummary } from "@/components/spending-summary"
import { SpendingChart } from "@/components/spending-chart"
import { ReceiptList } from "@/components/receipt-list"
import { useAuth } from "@/lib/mock-auth"

// Mock data
const mockStats = {
  totalReceipts: 47,
  totalTransactions: 156,
  avgSpending: 94.83,
  topCategory: "groceries",
}

const mockReceipts = [
  {
    id: "receipt-1",
    user_id: "user-123",
    merchant_name: "Whole Foods Market",
    total_amount: 87.43,
    currency: "USD",
    transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "groceries",
    payment_method: "credit_card",
    image_url: "/paper-receipt.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "receipt-2",
    user_id: "user-123",
    merchant_name: "Shell Gas Station",
    total_amount: 52.18,
    currency: "USD",
    transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: "transportation",
    payment_method: "debit_card",
    image_url: "/gas-receipt.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "receipt-3",
    user_id: "user-123",
    merchant_name: "Amazon",
    total_amount: 124.99,
    currency: "USD",
    transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: "shopping",
    payment_method: "credit_card",
    image_url: "/amazon-receipt.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockSpendingData = {
  week: {
    total: 567.89,
    change: 12.5,
    byCategory: [
      { category: "groceries", amount: 150.23, percentage: 26 },
      { category: "dining", amount: 95.45, percentage: 17 },
      { category: "transportation", amount: 85.12, percentage: 15 },
      { category: "shopping", amount: 180.89, percentage: 32 },
      { category: "other", amount: 56.2, percentage: 10 },
    ],
  },
  month: {
    total: 2847.32,
    change: -5.3,
    byCategory: [
      { category: "groceries", amount: 710.23, percentage: 25 },
      { category: "dining", amount: 512.45, percentage: 18 },
      { category: "transportation", amount: 455.12, percentage: 16 },
      { category: "shopping", amount: 825.89, percentage: 29 },
      { category: "utilities", amount: 285.5, percentage: 10 },
      { category: "other", amount: 58.13, percentage: 2 },
    ],
  },
  year: {
    total: 34156.84,
    change: 8.7,
    byCategory: [
      { category: "groceries", amount: 8539.21, percentage: 25 },
      { category: "dining", amount: 6148.23, percentage: 18 },
      { category: "transportation", amount: 5465.09, percentage: 16 },
      { category: "shopping", amount: 9905.48, percentage: 29 },
      { category: "utilities", amount: 3416.58, percentage: 10 },
      { category: "other", amount: 682.25, percentage: 2 },
    ],
  },
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Track your spending and manage your receipts</p>
        </div>

        <QuickStats stats={mockStats} />

        <div className="grid gap-8 lg:grid-cols-2">
          <SpendingSummary data={mockSpendingData[period]} period={period} onPeriodChange={setPeriod} />
          <SpendingChart period={period} />
        </div>

        <ReceiptList receipts={mockReceipts} />
      </main>
    </>
  )
}
