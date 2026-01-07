import { type NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { syncStripeDataToDatabase, findAndReassociateStripeCustomer } from '@/lib/stripe';
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
 * GET /api/users/me/subscription
 * Get user subscription details from Stripe
 */
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  const requestId = generateRequestId();

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    let stripeCustomerId = user.stripeCustomerId;

    // If no Stripe customer ID is set, try to find and re-associate it
    if (!stripeCustomerId) {
      Logger.info('No Stripe customer ID found, attempting to find and re-associate', {
        requestId,
        userId: user.id,
        context: { clerkId: user.clerkId, email: user.email },
      });

      stripeCustomerId = await findAndReassociateStripeCustomer(user.id, user.email, correlationId);

      if (!stripeCustomerId) {
        return NextResponse.json({
          hasStripeCustomer: false,
          subscribed: user.subscribed,
          message: 'No Stripe customer found for this user',
        });
      }
    }

    // Get subscription details from Stripe (this also updates the database)
    const subscriptionData = await syncStripeDataToDatabase(stripeCustomerId, correlationId);

    // Refetch user to get updated subscription status
    const updatedUser = await UserService.getUserProfile(user.id);

    Logger.info('Retrieved subscription details from Stripe', {
      requestId,
      userId: user.id,
      context: {
        clerkId: user.clerkId,
        email: user.email,
        stripeCustomerId: stripeCustomerId,
        subscriptionData,
        subscriptionStatus: updatedUser?.subscribed,
      },
    });

    return NextResponse.json({
      hasStripeCustomer: true,
      stripeCustomerId: stripeCustomerId,
      subscribed: updatedUser?.subscribed || false,
      subscriptionData,
      message: `Subscription status synced from Stripe: ${subscriptionData.status}`,
    });
  } catch (error) {
    Logger.error('Error retrieving subscription details', error as Error, {
      requestId,
    });
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to retrieve subscription details',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    });
  }
}

/**
 * PATCH /api/users/me/subscription
 * Update user subscription status
 */
export async function PATCH(req: NextRequest) {
  const requestId = generateRequestId();
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await req.json();

    // Validate subscribed field
    if (typeof body.subscribed !== 'boolean') {
      Logger.warn('Invalid subscription status value', {
        requestId,
        userId: user.id,
        context: { providedValue: body.subscribed },
      });
      const errorResponse = createErrorResponse(
        ErrorCode.INVALID_INPUT,
        'subscribed field must be a boolean',
        { field: 'subscribed', type: 'boolean' },
        requestId,
      );
      return NextResponse.json(errorResponse, {
        status: getHttpStatusCode(ErrorCode.INVALID_INPUT),
      });
    }

    // Update subscription status
    const updatedUser = await UserService.updateSubscriptionStatus(
      user.id,
      body.subscribed,
    );

    Logger.info('Subscription status updated successfully', {
      requestId,
      userId: user.id,
      context: { subscribed: body.subscribed },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    Logger.error('Error updating subscription status', error as Error, {
      requestId,
    });
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Failed to update subscription status',
      undefined,
      requestId,
    );
    return NextResponse.json(errorResponse, {
      status: getHttpStatusCode(ErrorCode.INTERNAL_SERVER_ERROR),
    });
  }
}
