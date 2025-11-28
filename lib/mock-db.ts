"use server"

import type { Receipt, BankTransaction, Household } from "./types"

// Mock database utilities (replace with Supabase when ready)
export async function getReceipts(userId: string): Promise<Receipt[]> {
  // Return mock receipts
  return [
    {
      id: "receipt-1",
      user_id: userId,
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
      user_id: userId,
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
      user_id: userId,
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
}

export async function getBankTransactions(userId: string): Promise<BankTransaction[]> {
  return [
    {
      id: "tx-1",
      bank_connection_id: "conn-1",
      user_id: userId,
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
      user_id: userId,
      transaction_id: "ext_tx_2",
      merchant_name: "Netflix",
      amount: -15.99,
      currency: "USD",
      transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: "entertainment",
      description: "Monthly subscription",
      created_at: new Date().toISOString(),
    },
  ]
}

export async function getUserHouseholds(userId: string): Promise<Household[]> {
  return [
    {
      id: "household-1",
      name: "Family Budget",
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

export async function getSpendingSummary(userId: string, period: "week" | "month" | "year") {
  const mockData = {
    week: { total: 567.89, change: 12.5 },
    month: { total: 2847.32, change: -5.3 },
    year: { total: 34156.84, change: 8.7 },
  }

  return {
    total: mockData[period].total,
    change: mockData[period].change,
    byCategory: [
      { category: "groceries", amount: 450.23, percentage: 25 },
      { category: "dining", amount: 320.45, percentage: 18 },
      { category: "transportation", amount: 280.12, percentage: 16 },
      { category: "shopping", amount: 520.89, percentage: 29 },
      { category: "utilities", amount: 180.5, percentage: 10 },
      { category: "other", amount: 95.13, percentage: 2 },
    ],
  }
}
