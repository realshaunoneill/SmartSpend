import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { UserService } from '@/lib/services/user-service';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

/**
 * PATCH /api/admin/users/[userId]
 * Update user properties (subscription status, block status, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  const { userId: targetUserId } = await params;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check if user is admin
    const adminCheck = await requireAdmin(user, correlationId);
    if (adminCheck) return adminCheck;

    // Get request body
    const body = await req.json();
    const { subscribed, isBlocked, blockedReason } = body as {
      subscribed?: boolean;
      isBlocked?: boolean;
      blockedReason?: string;
    };

    // Check if target user exists
    const targetUser = await UserService.getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Prevent modifying other admins
    if (targetUser.isAdmin && user.id !== targetUserId) {
      return NextResponse.json(
        { error: 'Cannot modify another admin user' },
        { status: 403 },
      );
    }

    // Prevent blocking yourself
    if (isBlocked === true && user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 },
      );
    }

    let updatedUser = targetUser;

    // Update subscription status if provided
    if (subscribed !== undefined) {
      updatedUser = await UserService.updateSubscriptionStatus(targetUserId, subscribed);
      submitLogEvent('admin', `Admin updated subscription for user ${targetUserId}`, correlationId, {
        adminId: user.id,
        targetUserId,
        subscribed,
      });
    }

    // Update block status if provided
    if (isBlocked !== undefined) {
      if (isBlocked) {
        updatedUser = await UserService.blockUser(targetUserId, blockedReason);
        submitLogEvent('admin', `Admin blocked user ${targetUserId}`, correlationId, {
          adminId: user.id,
          targetUserId,
          reason: blockedReason,
        });
      } else {
        updatedUser = await UserService.unblockUser(targetUserId);
        submitLogEvent('admin', `Admin unblocked user ${targetUserId}`, correlationId, {
          adminId: user.id,
          targetUserId,
        });
      }
    }

    // Update block reason only (without changing block status)
    if (blockedReason !== undefined && isBlocked === undefined && targetUser.isBlocked) {
      updatedUser = await UserService.updateBlockReason(targetUserId, blockedReason);
      submitLogEvent('admin', `Admin updated block reason for user ${targetUserId}`, correlationId, {
        adminId: user.id,
        targetUserId,
        reason: blockedReason,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscribed: updatedUser.subscribed,
        isAdmin: updatedUser.isAdmin,
        isBlocked: updatedUser.isBlocked,
        blockedAt: updatedUser.blockedAt,
        blockedReason: updatedUser.blockedReason,
        createdAt: updatedUser.createdAt,
        stripeCustomerId: updatedUser.stripeCustomerId,
      },
    });
  } catch (error) {
    submitLogEvent('admin', `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { targetUserId }, true);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}
