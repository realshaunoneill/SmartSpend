import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { households, householdUsers, householdInvitations, users } from "@/lib/db/schema";
import { HouseholdService } from "@/lib/services/household-service";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { CorrelationId, submitLogEvent } from "@/lib/logging";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Send invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params;
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Use the service to create the invitation
    const invitation = await HouseholdService.createInvitation(
      householdId,
      email,
      user.id
    );

    // Get household info for the response
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    submitLogEvent('invitation', `Invitation created for ${email}`, correlationId, { 
      householdId, 
      invitationId: invitation.id,
      invitedEmail: email 
    });

    return NextResponse.json({
      id: invitation.id,
      householdName: household?.name,
      invitedEmail: email,
      status: "pending",
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    submitLogEvent('invitation', `Error sending invitation: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// Get invitations for household
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: householdId } = await params;

    // Check if user is member of household
    const [membership] = await db
      .select()
      .from(householdUsers)
      .where(
        and(
          eq(householdUsers.householdId, householdId),
          eq(householdUsers.userId, user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to view invitations" },
        { status: 403 }
      );
    }

    // Get all invitations for this household
    const invitations = await db
      .select({
        id: householdInvitations.id,
        invitedEmail: householdInvitations.invitedEmail,
        status: householdInvitations.status,
        createdAt: householdInvitations.createdAt,
        expiresAt: householdInvitations.expiresAt,
        invitedByEmail: users.email,
      })
      .from(householdInvitations)
      .leftJoin(users, eq(householdInvitations.invitedByUserId, users.id))
      .where(eq(householdInvitations.householdId, householdId));

    return NextResponse.json(invitations);
  } catch (error) {
    submitLogEvent('invitation', `Error fetching invitations: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}