import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems, users } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { eq, desc, count, isNull, and } from "drizzle-orm";
import { submitLogEvent } from "@/lib/logging";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Clerk user email
    const email = await getClerkUserEmail(clerkId);
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email);

    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");
    const personalOnly = searchParams.get("personalOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let userReceipts;
    let totalCount;

    if (householdId) {
      // Get receipts for specific household (exclude deleted)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(and(
          eq(receipts.householdId, householdId),
          isNull(receipts.deletedAt)
        ))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(and(
          eq(receipts.householdId, householdId),
          isNull(receipts.deletedAt)
        ));
      totalCount = countResult.count;
    } else if (personalOnly) {
      // Get only personal receipts (not assigned to any household, exclude deleted)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(and(
          eq(receipts.userId, user.id),
          isNull(receipts.householdId),
          isNull(receipts.deletedAt)
        ))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(and(
          eq(receipts.userId, user.id),
          isNull(receipts.householdId),
          isNull(receipts.deletedAt)
        ));
      totalCount = countResult.count;
    } else {
      // Get all receipts for the user (personal + household, exclude deleted)
      userReceipts = await db
        .select()
        .from(receipts)
        .where(and(
          eq(receipts.userId, user.id),
          isNull(receipts.deletedAt)
        ))
        .orderBy(desc(receipts.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const [countResult] = await db
        .select({ count: count() })
        .from(receipts)
        .where(and(
          eq(receipts.userId, user.id),
          isNull(receipts.deletedAt)
        ));
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
    submitLogEvent('receipt', `Error fetching receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, null, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
