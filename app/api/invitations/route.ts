import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { households, householdUsers, householdInvitations } from '@/lib/db/schema';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

// Get user's pending invitations
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Get pending invitations for this user's email
    const invitations = await db
      .select({
        id: householdInvitations.id,
        householdId: householdInvitations.householdId,
        householdName: households.name,
        invitedByEmail: householdInvitations.invitedEmail,
        status: householdInvitations.status,
        createdAt: householdInvitations.createdAt,
        expiresAt: householdInvitations.expiresAt,
        token: householdInvitations.token,
      })
      .from(householdInvitations)
      .leftJoin(households, eq(householdInvitations.householdId, households.id))
      .where(
        and(
          eq(householdInvitations.invitedEmail, user.email),
          eq(householdInvitations.status, 'pending'),
        ),
      );

    // Filter out expired invitations
    const validInvitations = invitations.filter(
      (inv) => new Date(inv.expiresAt) > new Date(),
    );

    return NextResponse.json(validInvitations);
  } catch (error) {
    submitLogEvent('invitation', `Error fetching invitations: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 },
    );
  }
}
