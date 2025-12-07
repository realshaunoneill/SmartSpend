import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receipts, users, households } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { UserService } from "@/lib/services/user-service";
import { eq, isNull } from "drizzle-orm";
import { CorrelationId, submitLogEvent } from "@/lib/logging";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const isAdmin = await UserService.isAdmin(user.id);
    if (!isAdmin) {
      submitLogEvent('admin', 'Unauthorized admin access attempt', correlationId, { userId: user.id }, true);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all receipts with user and household information
    const allReceipts = await db
      .select({
        id: receipts.id,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        currency: receipts.currency,
        transactionDate: receipts.transactionDate,
        processingStatus: receipts.processingStatus,
        createdAt: receipts.createdAt,
        userId: receipts.userId,
        householdId: receipts.householdId,
      })
      .from(receipts)
      .where(isNull(receipts.deletedAt))
      .limit(500); // Limit to prevent huge responses

    // Enrich with user and household data
    const receiptsWithDetails = await Promise.all(
      allReceipts.map(async (r) => {
        const [userInfo] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, r.userId))
          .limit(1);

        let householdName = null;
        if (r.householdId) {
          const [householdInfo] = await db
            .select({ name: households.name })
            .from(households)
            .where(eq(households.id, r.householdId))
            .limit(1);
          householdName = householdInfo?.name || null;
        }

        return {
          id: r.id,
          merchantName: r.merchantName,
          totalAmount: r.totalAmount,
          currency: r.currency,
          transactionDate: r.transactionDate,
          processingStatus: r.processingStatus,
          createdAt: r.createdAt,
          userEmail: userInfo?.email || 'Unknown',
          householdName,
        };
      })
    );

    submitLogEvent('admin', 'Admin viewed receipts list', correlationId, { adminId: user.id });

    return NextResponse.json(receiptsWithDetails);
  } catch (error) {
    submitLogEvent('admin', `Error fetching receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
