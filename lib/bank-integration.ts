"use server"

import type { BankConnection } from "./types"

// Mock Plaid integration
export async function initiatePlaidConnection() {
  // Simulate Plaid Link token creation
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    linkToken: "link-sandbox-mock-token-123",
    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  }
}

export async function exchangePlaidToken(publicToken: string) {
  // Simulate token exchange
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    accessToken: "access-sandbox-mock-token-456",
    itemId: "item-mock-123",
  }
}

// Mock Revolut OAuth
export async function initiateRevolutConnection() {
  // Return OAuth URL
  return {
    authUrl: "https://revolut.com/oauth/authorize?mock=true",
    state: "state-mock-789",
  }
}

export async function saveBankConnection(data: {
  userId: string
  provider: "plaid" | "revolut"
  accountId: string
  accountName: string
  institutionName: string
  accessToken: string
}): Promise<BankConnection> {
  // Mock save to database
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    id: `conn-${Date.now()}`,
    user_id: data.userId,
    provider: data.provider,
    account_id: data.accountId,
    account_name: data.accountName,
    institution_name: data.institutionName,
    access_token_encrypted: "***encrypted***",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function syncBankTransactions(connectionId: string) {
  // Mock sync
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    synced: 15,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function disconnectBank(connectionId: string) {
  // Mock disconnect
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}
