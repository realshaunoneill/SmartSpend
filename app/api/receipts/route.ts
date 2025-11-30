import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems, users } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, desc, count, isNull, and } from "drizzle-orm";

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
    const personalOnly = searchParams.get("personalOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let userReceipts;
    let totalCount;

    if (householdId) {
      // Get receipts for specific household
      userReceipts = await db
        .select()
        .from(receipts)
        .where(eq(receipts.householdId, householdId))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(eq(receipts.householdId, householdId));
      totalCount = countResult.count;
    } else if (personalOnly) {
      // Get only personal receipts (not assigned to any household)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(and(eq(receipts.userId, user.id), isNull(receipts.householdId)))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(and(eq(receipts.userId, user.id), isNull(receipts.householdId)));
      totalCount = countResult.count;
    } else {
      // Get all receipts for the user (personal + household)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(eq(receipts.userId, user.id))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(eq(receipts.userId, user.id));
      totalCount = countResult.count;
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

    return NextResponse.json({
      receipts: receiptsWithDetails,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
