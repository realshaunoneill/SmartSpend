import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, householdUsers } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Assign receipt to household
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: receiptId } = await params;
    const { householdId } = await req.json();

    // Get the receipt
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .limit(1);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Check if user owns the receipt
    if (receipt.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this receipt" },
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
    console.error("Error assigning receipt:", error);
    return NextResponse.json(
      { error: "Failed to assign receipt" },
      { status: 500 }
    );
  }
}