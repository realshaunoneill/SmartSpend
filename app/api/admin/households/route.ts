import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { households, householdUsers, receipts, users } from '@/lib/db/schema';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { sql } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    // Get all households with members and receipt counts using efficient subqueries
    const householdsWithDetails = await db
      .select({
        id: households.id,
        name: households.name,
        createdAt: households.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${householdUsers}
          WHERE ${householdUsers.householdId} = ${households.id}
        )`,
        receiptCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${receipts}
          WHERE ${receipts.householdId} = ${households.id}
        )`,
        ownerEmail: sql<string>`(
          SELECT ${users.email}
          FROM ${householdUsers}
          INNER JOIN ${users} ON ${householdUsers.userId} = ${users.id}
          WHERE ${householdUsers.householdId} = ${households.id}
          LIMIT 1
        )`,
      })
      .from(households);

    submitLogEvent('admin', 'Admin viewed households list', correlationId, { adminId: user.id });

    return NextResponse.json(householdsWithDetails);
  } catch (error) {
    submitLogEvent('admin', `Error fetching households: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch households' },
      { status: 500 },
    );
  }
}
