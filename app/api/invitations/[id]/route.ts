import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { householdUsers, householdInvitations } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Accept or decline invitation
export async function PATCH(
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

    const { id: invitationId } = await params;
    const { action } = await req.json(); // 'accept' or 'decline'

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Get the invitation
    const [invitation] = await db
      .select()
      .from(householdInvitations)
      .where(
        and(
          eq(householdInvitations.id, invitationId),
          eq(householdInvitations.invitedEmail, user.email),
          eq(householdInvitations.status, "pending")
        )
      )
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or already processed" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await db
        .update(householdInvitations)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(householdInvitations.id, invitationId));

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Check if user is already a member
      const [existingMembership] = await db
        .select()
        .from(householdUsers)
        .where(
          and(
            eq(householdUsers.householdId, invitation.householdId),
            eq(householdUsers.userId, user.id)
          )
        )
        .limit(1);

      if (existingMembership) {
        return NextResponse.json(
          { error: "Already a member of this household" },
          { status: 400 }
        );
      }

      // Add user to household
      await db.insert(householdUsers).values({
        householdId: invitation.householdId,
        userId: user.id,
        role: "member",
      });

      // Update invitation status
      await db
        .update(householdInvitations)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(householdInvitations.id, invitationId));

      return NextResponse.json({
        message: "Invitation accepted successfully",
        householdId: invitation.householdId,
      });
    } else {
      // Decline invitation
      await db
        .update(householdInvitations)
        .set({ status: "declined", updatedAt: new Date() })
        .where(eq(householdInvitations.id, invitationId));

      return NextResponse.json({
        message: "Invitation declined",
      });
    }
  } catch (error) {
    console.error("Error processing invitation:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}