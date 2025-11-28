"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ReceiptList } from "@/components/receipt-list"
import { useAuth } from "@/lib/mock-auth"

// Mock receipts data (since we can't use server-side getReceipts with client auth)
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

export default function ReceiptsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-6xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Receipts</h1>
          <p className="mt-2 text-muted-foreground">Upload and manage your receipts with automatic scanning</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ReceiptUpload userId={user.id} />
          </div>
          <div>
            <ReceiptList receipts={mockReceipts} />
          </div>
        </div>
      </main>
    </>
  )
}
