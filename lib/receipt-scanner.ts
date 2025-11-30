"use server"

import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get receipts for a user
 */
export async function getUserReceipts(userId: string) {
  return await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(receipts.createdAt);
}

/**
 * Get receipts for a household
 */
export async function getHouseholdReceipts(householdId: string) {
  return await db
    .select()
    .from(receipts)
    .where(eq(receipts.householdId, householdId))
    .orderBy(receipts.createdAt);
}

/**
 * Get a single receipt by ID
 */
export async function getReceiptById(receiptId: string) {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  return receipt || null;
}
