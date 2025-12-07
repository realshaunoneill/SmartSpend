import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, receipts, householdUsers } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { UserService } from "@/lib/services/user-service";
import { eq, count, sql } from "drizzle-orm";
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

    // Get all users with receipt and household counts
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        subscribed: users.subscribed,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users);

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      allUsers.map(async (u) => {
        const [receiptCount] = await db
          .select({ count: count() })
          .from(receipts)
          .where(eq(receipts.userId, u.id));

        const [householdCount] = await db
          .select({ count: count() })
          .from(householdUsers)
          .where(eq(householdUsers.userId, u.id));

        return {
          ...u,
          receiptCount: receiptCount.count,
          householdCount: householdCount.count,
        };
      })
    );

    submitLogEvent('admin', 'Admin viewed users list', correlationId, { adminId: user.id });

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    submitLogEvent('admin', `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
