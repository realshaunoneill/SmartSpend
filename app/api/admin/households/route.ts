import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { households, householdUsers, receipts, users } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { UserService } from "@/lib/services/user-service";
import { eq, count } from "drizzle-orm";
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

    // Get all households with member and receipt counts
    const allHouseholds = await db
      .select({
        id: households.id,
        name: households.name,
        createdAt: households.createdAt,
      })
      .from(households);

    // Get counts and owner info for each household
    const householdsWithDetails = await Promise.all(
      allHouseholds.map(async (h) => {
        const [memberCount] = await db
          .select({ count: count() })
          .from(householdUsers)
          .where(eq(householdUsers.householdId, h.id));

        const [receiptCount] = await db
          .select({ count: count() })
          .from(receipts)
          .where(eq(receipts.householdId, h.id));

        // Get owner email
        const [owner] = await db
          .select({ email: users.email })
          .from(householdUsers)
          .innerJoin(users, eq(householdUsers.userId, users.id))
          .where(eq(householdUsers.householdId, h.id))
          .limit(1);

        return {
          ...h,
          memberCount: memberCount.count,
          receiptCount: receiptCount.count,
          ownerEmail: owner?.email || 'Unknown',
        };
      })
    );

    submitLogEvent('admin', 'Admin viewed households list', correlationId, { adminId: user.id });

    return NextResponse.json(householdsWithDetails);
  } catch (error) {
    submitLogEvent('admin', `Error fetching households: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch households" },
      { status: 500 }
    );
  }
}
