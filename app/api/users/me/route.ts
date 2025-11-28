import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user-service'
import {
  createErrorResponse,
  ErrorCode,
  generateRequestId,
  getHttpStatusCode,
  Logger,
} from '@/lib/errors'

/**
 * GET /api/users/me
 * Get current user profile (creates user if doesn't exist)
 */
export async function GET() {
  const requestId = generateRequestId()

  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      Logger.warn('Unauthenticated request to /api/users/me', { requestId })
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

    Logger.info('User profile fetched successfully', {
      requestId,
      userId: user.id,
    })
    return NextResponse.json(user)
  } catch (error) {
    Logger.error('Error fetching user profile', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to fetch user profile',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    })
  }
}

/**
 * PATCH /api/users/me
 * Update user profile
 */
export async function PATCH(req: Request) {
  const requestId = generateRequestId()

  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      Logger.warn('Unauthenticated request to PATCH /api/users/me', { requestId })
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

    // Get user from database
    const user = await UserService.getUserByClerkId(clerkId)

    if (!user) {
      Logger.warn('User not found in database', {
        requestId,
        context: { clerkId },
      })
      const errorResponse = createErrorResponse(
        ErrorCode.NOT_FOUND,
        'User not found',
        undefined,
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.NOT_FOUND),
      })
    }

    const body = await req.json()

    // For now, we only support updating email
    // Additional fields can be added as needed
    if (body.email && typeof body.email === 'string') {
      // Note: In a real application, you'd want to validate the email format
      // and potentially require email verification
      const { db } = await import('@/lib/db')
      const { users } = await import('@/lib/db/schema')
      const { eq } = await import('drizzle-orm')

      const [updatedUser] = await db
        .update(users)
        .set({ email: body.email, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning()

      Logger.info('User profile updated successfully', {
        requestId,
        userId: user.id,
      })
      return NextResponse.json(updatedUser)
    }

    // If no valid fields to update, return current user
    Logger.info('No valid fields to update, returning current user', {
      requestId,
      userId: user.id,
    })
    return NextResponse.json(user)
  } catch (error) {
    Logger.error('Error updating user profile', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update user profile',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    })
  }
}
