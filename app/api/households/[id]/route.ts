import { type NextRequest, NextResponse } from 'next/server';
import { HouseholdService } from '@/lib/services/household-service';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import {
  createErrorResponse,
  ErrorCode,
  generateRequestId,
  getHttpStatusCode,
  Logger,
} from '@/lib/errors';
import { randomUUID } from 'crypto';
import { type CorrelationId } from '@/lib/logging';

/**
 * GET /api/households/:id
 * Get household details including members
 * Validates: Requirements 3.4
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params;

    // Get all households for the user to verify access
    const userHouseholds = await HouseholdService.getHouseholdsByUser(user.id);
    const household = userHouseholds.find((h) => h.id === householdId);

    if (!household) {
      Logger.warn('User attempted to access household without permission', {
        requestId,
        userId: user.id,
        context: { householdId },
      });
      const errorResponse = createErrorResponse(
        ErrorCode.FORBIDDEN,
        'Access denied to this household',
        undefined,
        requestId,
      );
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.FORBIDDEN),
      });
    }

    // Get household members
    const members = await HouseholdService.getHouseholdMembers(householdId);

    Logger.info('Household details fetched successfully', {
      requestId,
      userId: user.id,
      context: { householdId, memberCount: members.length },
    });
    return NextResponse.json({
      ...household,
      members,
    });
  } catch (error) {
    Logger.error('Error fetching household', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to fetch household',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    });
  }
}

/**
 * PATCH /api/households/:id
 * Update household name
 * Validates: Requirements 3.4
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params;

    // Verify user is the owner
    const isOwner = await HouseholdService.isOwner(householdId, user.id);

    if (!isOwner) {
      Logger.warn('Non-owner attempted to update household', {
        requestId,
        userId: user.id,
        context: { householdId },
      });
      const errorResponse = createErrorResponse(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        'Only household owners can update household details',
        undefined,
        requestId,
      );
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.INSUFFICIENT_PERMISSIONS),
      });
    }

    const body = await req.json();

    // Validate request body
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      Logger.warn('Invalid household name provided', {
        requestId,
        userId: user.id,
        context: { householdId },
      });
      const errorResponse = createErrorResponse(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Household name is required',
        { field: 'name' },
        requestId,
      );
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.MISSING_REQUIRED_FIELD),
      });
    }

    // Update household name
    const { db } = await import('@/lib/db');
    const { households } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [updatedHousehold] = await db
      .update(households)
      .set({ name: body.name.trim(), updatedAt: new Date() })
      .where(eq(households.id, householdId))
      .returning();

    Logger.info('Household updated successfully', {
      requestId,
      userId: user.id,
      context: { householdId, newName: body.name.trim() },
    });
    return NextResponse.json(updatedHousehold);
  } catch (error) {
    Logger.error('Error updating household', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to update household',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    });
  }
}

/**
 * DELETE /api/households/:id
 * Delete a household (owner only)
 * Validates: Requirements 3.5
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params;

    // Delete household (will verify ownership inside the service)
    await HouseholdService.deleteHousehold(householdId, user.id);

    Logger.info('Household deleted successfully', {
      requestId,
      userId: user.id,
      context: { householdId },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error && error.message.includes('Only household owners')) {
      Logger.warn('Non-owner attempted to delete household', {
        requestId,
        context: { error: error.message },
      });
      const errorResponse = createErrorResponse(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        error.message,
        undefined,
        requestId,
      );
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.INSUFFICIENT_PERMISSIONS),
      });
    }

    Logger.error('Error deleting household', error as Error, { requestId });
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to delete household',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    });
  }
}
