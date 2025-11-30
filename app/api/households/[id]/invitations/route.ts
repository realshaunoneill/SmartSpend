import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { households, householdUsers, householdInvitations, users } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

// Send invitation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: householdId } = await params;
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user is owner/member of household
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
        { error: "Not authorized to invite to this household" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const invitedUser = await UserService.getUserByEmail(email);
    if (invitedUser) {
      const [existingMembership] = await db
        .select()
        .from(householdUsers)
        .where(
          and(
            eq(householdUsers.householdId, householdId),
            eq(householdUsers.userId, invitedUser.id)
          )
        )
        .limit(1);

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member of this household" },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const [existingInvitation] = await db
      .select()
      .from(householdInvitations)
      .where(
        and(
          eq(householdInvitations.householdId, householdId),
          eq(householdInvitations.invitedEmail, email),
          eq(householdInvitations.status, "pending")
        )
      )
      .limit(1);

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Create invitation
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db
      .insert(householdInvitations)
      .values({
        householdId,
        invitedByUserId: user.id,
        invitedEmail: email,
        token,
        expiresAt,
      })
      .returning();

    // Get household info for the response
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    return NextResponse.json({
      id: invitation.id,
      householdName: household?.name,
      invitedEmail: email,
      status: "pending",
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// Get invitations for household
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}