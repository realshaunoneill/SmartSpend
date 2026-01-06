import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { households, householdUsers, receipts, users } from '@/lib/db/schema';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { eq, count, inArray } from 'drizzle-orm';
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

    // Get all households
    const allHouseholds = await db.select().from(households);

    if (allHouseholds.length === 0) {
      return NextResponse.json([]);
    }

    const householdIds = allHouseholds.map((h) => h.id);

    // Batch query: Get member counts grouped by household
    const memberCounts = await db
      .select({
        householdId: householdUsers.householdId,
        count: count(),
      })
      .from(householdUsers)
      .where(inArray(householdUsers.householdId, householdIds))
      .groupBy(householdUsers.householdId);

    // Batch query: Get receipt counts grouped by household
    const receiptCounts = await db
      .select({
        householdId: receipts.householdId,
        count: count(),
      })
      .from(receipts)
      .where(inArray(receipts.householdId, householdIds))
      .groupBy(receipts.householdId);

    // Batch query: Get first member (owner) email for each household
    const householdMembers = await db
      .select({
        householdId: householdUsers.householdId,
        email: users.email,
      })
      .from(householdUsers)
      .innerJoin(users, eq(householdUsers.userId, users.id))
      .where(inArray(householdUsers.householdId, householdIds));

    // Create lookup maps
    const memberCountMap = new Map(memberCounts.map((m) => [m.householdId, m.count]));
    const receiptCountMap = new Map(receiptCounts.map((r) => [r.householdId, r.count]));
    const ownerEmailMap = new Map<string, string>();
    for (const member of householdMembers) {
      // Only set if not already set (first member becomes "owner")
      if (!ownerEmailMap.has(member.householdId)) {
        ownerEmailMap.set(member.householdId, member.email);
      }
    }

    // Combine results
    const householdsWithDetails = allHouseholds.map((household) => ({
      id: household.id,
      name: household.name,
      createdAt: household.createdAt,
      memberCount: memberCountMap.get(household.id) ?? 0,
      receiptCount: receiptCountMap.get(household.id) ?? 0,
      ownerEmail: ownerEmailMap.get(household.id) ?? null,
    }));

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
