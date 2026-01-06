import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireAdmin } from '@/lib/auth-helpers';
import { UserService } from '@/lib/services/user-service';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/admin/users/[userId]/block
 * Block a user from using the app
 */
export async function POST(
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

    // Prevent blocking yourself
    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 },
      );
    }

    // Get request body for reason
    const body = await req.json().catch(() => ({}));
    const reason = body.reason as string | undefined;

    // Check if target user exists
    const targetUser = await UserService.getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Prevent blocking other admins
    if (targetUser.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot block an admin user' },
        { status: 403 },
      );
    }

    // Block the user
    const blockedUser = await UserService.blockUser(targetUserId, reason);

    submitLogEvent('admin', `Admin blocked user ${targetUserId}`, correlationId, {
      adminId: user.id,
      targetUserId,
      reason,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: blockedUser.id,
        email: blockedUser.email,
        isBlocked: blockedUser.isBlocked,
        blockedAt: blockedUser.blockedAt,
        blockedReason: blockedUser.blockedReason,
      },
    });
  } catch (error) {
    submitLogEvent('admin', `Error blocking user: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { targetUserId }, true);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]/block
 * Unblock a user
 */
export async function DELETE(
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

    // Check if target user exists
    const targetUser = await UserService.getUserProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Unblock the user
    const unblockedUser = await UserService.unblockUser(targetUserId);

    submitLogEvent('admin', `Admin unblocked user ${targetUserId}`, correlationId, {
      adminId: user.id,
      targetUserId,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: unblockedUser.id,
        email: unblockedUser.email,
        isBlocked: unblockedUser.isBlocked,
      },
    });
  } catch (error) {
    submitLogEvent('admin', `Error unblocking user: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, { targetUserId }, true);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 },
    );
  }
}
