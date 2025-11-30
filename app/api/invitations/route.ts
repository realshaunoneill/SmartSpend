import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { households, householdUsers, householdInvitations } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Get user's pending invitations
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get pending invitations for this user's email
    const invitations = await db
      .select({
        id: householdInvitations.id,
        householdId: householdInvitations.householdId,
        householdName: households.name,
        invitedByEmail: householdInvitations.invitedEmail,
        status: householdInvitations.status,
        createdAt: householdInvitations.createdAt,
        expiresAt: householdInvitations.expiresAt,
        token: householdInvitations.token,
      })
      .from(householdInvitations)
      .leftJoin(households, eq(householdInvitations.householdId, households.id))
      .where(
        and(
          eq(householdInvitations.invitedEmail, user.email),
          eq(householdInvitations.status, "pending")
        )
      );

    // Filter out expired invitations
    const validInvitations = invitations.filter(
      (inv) => new Date(inv.expiresAt) > new Date()
    );

    return NextResponse.json(validInvitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}