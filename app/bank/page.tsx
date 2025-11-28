"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { AddBankDialog } from "@/components/add-bank-dialog"
import { BankConnectionCard } from "@/components/bank-connection-card"
import { BankTransactionsList } from "@/components/bank-transactions-list"
import type { BankConnection, BankTransaction } from "@/lib/types"

// Mock data
const mockConnections: BankConnection[] = [
  {
    id: "conn-1",
    user_id: "user-123",
    provider: "plaid",
    account_id: "account-123",
    account_name: "Checking Account",
    institution_name: "Chase Bank",
    is_active: true,
    last_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "conn-2",
    user_id: "user-123",
    provider: "revolut",
    account_id: "revolut-456",
    account_name: "Revolut Account",
    institution_name: "Revolut",
    is_active: true,
    last_synced_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockTransactions: BankTransaction[] = [
  {
    id: "tx-1",
    bank_connection_id: "conn-1",
    user_id: "user-123",
    transaction_id: "ext_tx_1",
    merchant_name: "Starbucks",
    amount: -5.75,
    currency: "USD",
    transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: "dining",
    description: "Coffee purchase",
    created_at: new Date().toISOString(),
  },
  {
    id: "tx-2",
    bank_connection_id: "conn-1",
    user_id: "user-123",
    transaction_id: "ext_tx_2",
    merchant_name: "Netflix",
    amount: -15.99,
    currency: "USD",
    transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: "entertainment",
    description: "Monthly subscription",
    created_at: new Date().toISOString(),
  },
  {
    id: "tx-3",
    bank_connection_id: "conn-2",
    user_id: "user-123",
    transaction_id: "ext_tx_3",
    merchant_name: "Salary Deposit",
    amount: 3500.0,
    currency: "USD",
    transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: "income",
    description: "Monthly salary",
    created_at: new Date().toISOString(),
  },
  {
    id: "tx-4",
    bank_connection_id: "conn-1",
    user_id: "user-123",
    transaction_id: "ext_tx_4",
    merchant_name: "Uber",
    amount: -23.45,
    currency: "USD",
    transaction_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: "transportation",
    description: "Ride to downtown",
    created_at: new Date().toISOString(),
  },
]

export default function BankPage() {
  const [connections, setConnections] = useState<BankConnection[]>(mockConnections)
  const [transactions] = useState<BankTransaction[]>(mockTransactions)

  const handleBankAdded = () => {
    // In production, refetch connections
    console.log("[v0] Bank added, would refetch connections")
  }

  const handleBankDisconnected = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId))
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-6xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Bank Accounts</h1>
            <p className="mt-2 text-muted-foreground">
              Connect and manage your bank accounts for automatic transaction syncing
            </p>
          </div>
          <AddBankDialog userId="user-123" onBankAdded={handleBankAdded} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Connected Accounts</h2>
          {connections.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">No bank accounts connected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your first bank account to start syncing transactions
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {connections.map((connection) => (
                <BankConnectionCard
                  key={connection.id}
                  connection={connection}
                  onDisconnect={() => handleBankDisconnected(connection.id)}
                />
              ))}
            </div>
          )}
        </div>

        <BankTransactionsList transactions={transactions} />
      </main>
    </>
  )
}
