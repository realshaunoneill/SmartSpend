import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, receipts, householdUsers } from "@/lib/db/schema";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth-helpers";
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
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    // Get all users with receipt and household counts using efficient subqueries
    const usersWithCounts = await db
      .select({
        id: users.id,
        email: users.email,
        subscribed: users.subscribed,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        stripeCustomerId: users.stripeCustomerId,
        receiptCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${receipts}
          WHERE ${receipts.userId} = ${users.id}
        )`,
        householdCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${householdUsers}
          WHERE ${householdUsers.userId} = ${users.id}
        )`,
      })
      .from(users);

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
