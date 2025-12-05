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
 * GET /api/households/:id/members
 * Get all members of a household
 * Validates: Requirements 3.4
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()

  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params

    // Get household members
    const members = await HouseholdService.getHouseholdMembers(householdId)

    Logger.info('Household members fetched successfully', {
      requestId,
      userId: user.id,
      context: { householdId, memberCount: members.length },
    })
    return NextResponse.json(members)
  } catch (error) {
    Logger.error('Error fetching household members', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to fetch household members',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    })
  }
}

/**
 * POST /api/households/:id/members
 * Invite a member to the household
 * Validates: Requirements 3.3
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId()

  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params
    const body = await req.json()

    // Validate request body
    if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
      Logger.warn('Invalid email provided for member invitation', {
        requestId,
        userId: user.id,
        context: { householdId },
      })
      const errorResponse = createErrorResponse(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Email is required',
        { field: 'email' },
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.MISSING_REQUIRED_FIELD),
      })
    }

    // Invite member (will verify ownership inside the service)
    const householdUser = await HouseholdService.inviteMember(
      householdId,
      body.email.trim(),
      user.id
    )

    Logger.info('Member invited successfully', {
      requestId,
      userId: user.id,
      context: { householdId, invitedEmail: body.email.trim() },
    })
    return NextResponse.json(householdUser, { status: 201 })
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Only household owners')) {
        Logger.warn('Non-owner attempted to invite member', {
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
      if (error.message.includes('User not found')) {
        Logger.warn('Attempted to invite non-existent user', {
          requestId,
          context: { error: error.message },
        })
        const errorResponse = createErrorResponse(
          ErrorCode.NOT_FOUND,
          error.message,
          undefined,
          requestId
        )
        return NextResponse.json(errorResponse, {
          status: getHttpStatusCode(ErrorCode.NOT_FOUND),
        })
      }
      if (error.message.includes('already a member')) {
        Logger.warn('Attempted to invite existing member', {
          requestId,
          context: { error: error.message },
        })
        const errorResponse = createErrorResponse(
          ErrorCode.CONSTRAINT_VIOLATION,
          error.message,
          undefined,
          requestId
        )
        return NextResponse.json(errorResponse, {
          status: getHttpStatusCode(ErrorCode.CONSTRAINT_VIOLATION),
        })
      }
    }

    Logger.error('Error inviting member', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to invite member',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    })
  }
}
