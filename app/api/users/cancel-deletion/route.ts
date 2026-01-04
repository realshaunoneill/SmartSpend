import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { Logger, createErrorResponse, ErrorCode, getHttpStatusCode, generateRequestId } from '@/lib/errors';
import { type CorrelationId } from '@/lib/logging';
import { randomUUID } from 'crypto';

// POST - Cancel scheduled account deletion
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);

    if (authResult instanceof NextResponse) {
      Logger.warn('Unauthorized cancel deletion attempt', { requestId });
      return authResult;
    }

    const { user } = authResult;

    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    // Check if deletion is scheduled
    if (!user.deletionScheduledAt) {
      Logger.info('No deletion scheduled to cancel', { requestId, userId: user.id });
      return NextResponse.json({
        success: false,
        message: 'No account deletion is currently scheduled.',
      });
    }

    // Cancel the deletion
    const [_updatedUser] = await db
      .update(users)
      .set({
        deletionScheduledAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    Logger.info('Account deletion cancelled', {
      requestId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion has been cancelled. Your account is safe.',
    });
  } catch (error) {
    Logger.error('Error cancelling account deletion', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to cancel account deletion',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    });
  }
}
