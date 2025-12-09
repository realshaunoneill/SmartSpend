import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, householdUsers } from '@/lib/db/schema';
import { UserService } from '@/lib/services/user-service';
import { getClerkUserEmail } from '@/lib/auth-helpers';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * PATCH /api/users/default-household
 * Update the user's default household
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = await getClerkUserEmail(clerkId);
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const user = await UserService.getOrCreateUser(clerkId, email);

    const body = await req.json();
    const { householdId } = body;

    // If householdId is provided, verify user has access to it
    if (householdId) {
      const membership = await db
        .select()
        .from(householdUsers)
        .where(
          and(
            eq(householdUsers.userId, user.id),
            eq(householdUsers.householdId, householdId),
          ),
        )
        .limit(1);

      if (membership.length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this household' },
          { status: 403 },
        );
      }
    }

    // Update the user's default household
    await db
      .update(users)
      .set({
        defaultHouseholdId: householdId || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      defaultHouseholdId: householdId || null,
    });
  } catch (error) {
    console.error('Error updating default household:', error);
    return NextResponse.json(
      { error: 'Failed to update default household' },
      { status: 500 },
    );
  }
}
