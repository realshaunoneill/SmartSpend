import { NextResponse } from 'next/server'
import { HouseholdService } from '@/lib/services/household-service'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import {
  createErrorResponse,
  ErrorCode,
  generateRequestId,
  getHttpStatusCode,
  Logger,
} from '@/lib/errors'

/**
 * DELETE /api/households/:id/members/:userId
 * Remove a member from the household
 * Validates: Requirements 3.5
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const requestId = generateRequestId()

  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId, userId: memberUserId } = await params

    // Remove member (will verify ownership inside the service)
    await HouseholdService.removeMember(householdId, memberUserId, user.id)

    Logger.info('Member removed successfully', {
      requestId,
      userId: user.id,
      context: { householdId, removedUserId: memberUserId },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Only household owners')) {
        Logger.warn('Non-owner attempted to remove member', {
          requestId,
          context: { error: error.message },
        })
        const errorResponse = createErrorResponse(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          error.message,
          undefined,
          requestId
        )
        return NextResponse.json(errorResponse, {
          status: getHttpStatusCode(ErrorCode.INSUFFICIENT_PERMISSIONS),
        })
      }
      if (error.message.includes('cannot remove themselves')) {
        Logger.warn('Owner attempted to remove themselves', {
          requestId,
          context: { error: error.message },
        })
        const errorResponse = createErrorResponse(
          ErrorCode.INVALID_INPUT,
          error.message,
          undefined,
          requestId
        )
        return NextResponse.json(errorResponse, {
          status: getHttpStatusCode(ErrorCode.INVALID_INPUT),
        })
      }
    }

    Logger.error('Error removing member', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to remove member',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    })
  }
}
