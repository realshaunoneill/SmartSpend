import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems, users } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");

    let userReceipts;

    if (householdId) {
      // Get receipts for specific household
      userReceipts = await db
        .select()
        .from(receipts)
        .where(eq(receipts.householdId, householdId))
        .orderBy(desc(receipts.createdAt));
    } else {
      // Get all receipts for the user (personal + household)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(eq(receipts.userId, user.id))
        .orderBy(desc(receipts.createdAt));
    }

    // Get items and user info for each receipt
    const receiptsWithDetails = await Promise.all(
      userReceipts.map(async (receipt) => {
        const items = await db
          .select()
          .from(receiptItems)
          .where(eq(receiptItems.receiptId, receipt.id));

        // Get user who created the receipt
        const [receiptUser] = await db
          .select({
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, receipt.userId))
          .limit(1);

        return {
          ...receipt,
          items,
          submittedBy: receiptUser?.email || "Unknown",
        };
      }),
    );

    return NextResponse.json(receiptsWithDetails);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
