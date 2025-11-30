import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all receipts for the user
    const userReceipts = await db
      .select()
      .from(receipts)
      .where(eq(receipts.userId, user.id))
      .orderBy(desc(receipts.createdAt));

    // Get items for each receipt
    const receiptsWithItems = await Promise.all(
      userReceipts.map(async (receipt) => {
        const items = await db
          .select()
          .from(receiptItems)
          .where(eq(receiptItems.receiptId, receipt.id));

        return {
          ...receipt,
          items,
        };
      }),
    );

    return NextResponse.json(receiptsWithItems);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
