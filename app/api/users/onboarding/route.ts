import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

/**
 * PATCH /api/users/onboarding
 * Mark the user's onboarding as complete
 */
export async function PATCH(request: Request) {
  const correlationId = (request.headers.get('x-correlation-id') as CorrelationId) || (randomUUID() as CorrelationId);

  const authResult = await getAuthenticatedUser(correlationId);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    // Update the user's onboarding completion timestamp
    await db
      .update(users)
      .set({
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    submitLogEvent('user', 'User completed onboarding', correlationId, {
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    submitLogEvent('user', `Error marking onboarding complete: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);

    return NextResponse.json(
      { error: 'Failed to mark onboarding as complete' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/users/onboarding
 * Check if the user has completed onboarding
 */
export async function GET(request: Request) {
  const correlationId = (request.headers.get('x-correlation-id') as CorrelationId) || (randomUUID() as CorrelationId);

  const authResult = await getAuthenticatedUser(correlationId);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    return NextResponse.json({
      completed: !!user.onboardingCompletedAt,
      completedAt: user.onboardingCompletedAt,
    });
  } catch (error) {
    submitLogEvent('user', `Error checking onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);

    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 },
    );
  }
}
