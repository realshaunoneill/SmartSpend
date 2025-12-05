import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receipts, householdUsers } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { CorrelationId, submitLogEvent } from "@/lib/logging";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Assign receipt to household
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: receiptId } = await params;
    const { householdId } = await request.json();

    // Get the receipt
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Check permissions based on current state and action
    const isOwner = receipt.userId === user.id;
    
    // If receipt is currently in a household, check if user can remove it
    if (receipt.householdId && householdId === null) {
      // Removing from household - check if user is owner OR household admin
      if (!isOwner) {
        const [membership] = await db
          .select()
          .from(householdUsers)
          .where(
            and(
              eq(householdUsers.householdId, receipt.householdId),
              eq(householdUsers.userId, user.id)
            )
          )
          .limit(1);

        if (!membership || membership.role !== "owner") {
          return NextResponse.json(
            { error: "Only the receipt owner or household admin can remove receipts" },
            { status: 403 }
          );
        }
      }
    } else {
      // Adding to household or changing household - only owner can do this
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the receipt owner can assign receipts to households" },
          { status: 403 }
        );
      }

      // If assigning to a household, verify user is a member
      if (householdId) {
        const [membership] = await db
          .select()
          .from(householdUsers)
          .where(
            and(
              eq(householdUsers.householdId, householdId),
              eq(householdUsers.userId, user.id)
            )
          )
          .limit(1);

        if (!membership) {
          return NextResponse.json(
            { error: "Not a member of this household" },
            { status: 403 }
          );
        }
      }
    }

    // Update receipt
    const [updatedReceipt] = await db
      .update(receipts)
      .set({ 
        householdId: householdId || null,
        updatedAt: new Date()
      })
      .where(eq(receipts.id, receiptId))
      .returning();

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    submitLogEvent('receipt', `Error assigning receipt: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: "Failed to assign receipt" },
      { status: 500 }
    );
  }
}