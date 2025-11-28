import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import { getClerkUserEmail } from '@/lib/auth-helpers'
import {
  createErrorResponse,
  ErrorCode,
  generateRequestId,
  getHttpStatusCode,
  Logger,
} from '@/lib/errors'

/**
 * PATCH /api/users/me/subscription
 * Update user subscription status
 */
export async function PATCH(req: Request) {
  const requestId = generateRequestId()

  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      Logger.warn('Unauthenticated request to PATCH /api/users/me/subscription', {
        requestId,
      })
      const errorResponse = createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
        undefined,
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.UNAUTHORIZED),
      })
    }

    // Get Clerk user to access email
    // Get Clerk user email
    const email = await getClerkUserEmail(clerkId)
    

    if (!email) {
      Logger.warn('User has no email address', {
        requestId,
        context: { clerkId },
      })
      const errorResponse = createErrorResponse(
        ErrorCode.BAD_REQUEST,
        'User email not found',
        undefined,
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.BAD_REQUEST),
      })
    }

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email)

    const body = await req.json()

    // Validate subscribed field
    if (typeof body.subscribed !== 'boolean') {
      Logger.warn('Invalid subscription status value', {
        requestId,
        userId: user.id,
        context: { providedValue: body.subscribed },
      })
      const errorResponse = createErrorResponse(
        ErrorCode.INVALID_INPUT,
        'subscribed field must be a boolean',
        { field: 'subscribed', type: 'boolean' },
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.INVALID_INPUT),
      })
    }

    // Update subscription status
    const updatedUser = await UserService.updateSubscriptionStatus(
      user.id,
      body.subscribed
    )

    Logger.info('Subscription status updated successfully', {
      requestId,
      userId: user.id,
      context: { subscribed: body.subscribed },
    })
    return NextResponse.json(updatedUser)
  } catch (error) {
    Logger.error('Error updating subscription status', error as Error, {
      requestId,
    })
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update subscription status',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    })
  }
}
