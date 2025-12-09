import { type NextRequest, NextResponse } from 'next/server';
import {
  createErrorResponse,
  ErrorCode,
  generateRequestId,
  getHttpStatusCode,
  Logger,
} from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { randomUUID } from 'crypto';
import { type CorrelationId } from '@/lib/logging';

/**
 * GET /api/users/me
 * Get current user profile (creates user if doesn't exist)
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);

    if (authResult instanceof NextResponse) {
      Logger.warn('Unauthenticated request to /api/users/me', { requestId });
      return authResult;
    }

    const { user } = authResult;

    Logger.info('User profile fetched successfully', {
      requestId,
      userId: user.id,
    });
    return NextResponse.json(user, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    Logger.error('Error fetching user profile', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch user profile',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    });
  }
}

/**
 * PATCH /api/users/me
 * Update user profile
 */
export async function PATCH(req: NextRequest) {
  const requestId = generateRequestId();
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);

    if (authResult instanceof NextResponse) {
      Logger.warn('Unauthenticated request to PATCH /api/users/me', { requestId });
      return authResult;
    }

    const { user } = authResult;

    const body = await req.json();

    // For now, we only support updating email
    // Additional fields can be added as needed
    if (body.email && typeof body.email === 'string') {
      // Note: In a real application, you'd want to validate the email format
      // and potentially require email verification
      const { db } = await import('@/lib/db');
      const { users } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');

      const [updatedUser] = await db
        .update(users)
        .set({ email: body.email, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();

      Logger.info('User profile updated successfully', {
        requestId,
        userId: user.id,
      });
      return NextResponse.json(updatedUser);
    }

    // If no valid fields to update, return current user
    Logger.info('No valid fields to update, returning current user', {
      requestId,
      userId: user.id,
    });
    return NextResponse.json(user);
  } catch (error) {
    Logger.error('Error updating user profile', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update user profile',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    });
  }
}
