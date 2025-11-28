import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { HouseholdService } from '@/lib/services/household-service'
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
 * GET /api/households
 * List all households the current user belongs to
 * Validates: Requirements 3.6
 */
export async function GET() {
  const requestId = generateRequestId()

  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      Logger.warn('Unauthenticated request to GET /api/households', { requestId })
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

    // Get all households for the user
    const households = await HouseholdService.getHouseholdsByUser(user.id)

    Logger.info('Households fetched successfully', {
      requestId,
      userId: user.id,
      context: { count: households.length },
    })
    return NextResponse.json(households)
  } catch (error) {
    Logger.error('Error fetching households', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to fetch households',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    })
  }
}

/**
 * POST /api/households
 * Create a new household
 * Validates: Requirements 3.1, 3.2
 */
export async function POST(req: Request) {
  const requestId = generateRequestId()

  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      Logger.warn('Unauthenticated request to POST /api/households', { requestId })
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

    // Validate request body
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      Logger.warn('Invalid household name provided', {
        requestId,
        userId: user.id,
      })
      const errorResponse = createErrorResponse(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Household name is required',
        { field: 'name' },
        requestId
      )
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.MISSING_REQUIRED_FIELD),
      })
    }

    // Create household with user as owner
    const household = await HouseholdService.createHousehold(
      user.id,
      body.name.trim()
    )

    Logger.info('Household created successfully', {
      requestId,
      userId: user.id,
      context: { householdId: household.id, householdName: household.name },
    })
    return NextResponse.json(household, { status: 201 })
  } catch (error) {
    Logger.error('Error creating household', error as Error, { requestId })
    const errorResponse = createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Failed to create household',
      undefined,
      requestId
    )
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.DATABASE_ERROR),
    })
  }
}
