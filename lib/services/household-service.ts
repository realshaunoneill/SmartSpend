import { db } from '@/lib/db';
import { households, householdUsers, householdInvitations, users, type Household, type HouseholdInvitation, type HouseholdMember, type NewHousehold, type NewHouseholdUser } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export class HouseholdService {
  /**
   * Create a new household and assign the creator as owner
   * Validates: Requirements 3.1, 3.2
   */
  static async createHousehold(userId: string, name: string): Promise<Household> {
    // Create household and household_users record in a transaction
    const result = await db.transaction(async (tx) => {
      // Create the household
      const newHousehold: NewHousehold = {
        name,
      };

      const [household] = await tx.insert(households).values(newHousehold).returning();

      // Assign creator as owner
      const newHouseholdUser: NewHouseholdUser = {
        householdId: household.id,
        userId,
        role: 'owner',
      };

      await tx.insert(householdUsers).values(newHouseholdUser);

      return household;
    });

    return result;
  }

  /**
   * Get all households a user belongs to with member count and user's role
   * Validates: Requirements 3.6
   */
  static async getHouseholdsByUser(userId: string): Promise<(Household & { memberCount: number; isAdmin: boolean })[]> {
    // First get all households the user belongs to with their role
    const userHouseholds = await db
      .select({
        id: households.id,
        name: households.name,
        createdAt: households.createdAt,
        updatedAt: households.updatedAt,
        userRole: householdUsers.role,
      })
      .from(households)
      .innerJoin(householdUsers, eq(households.id, householdUsers.householdId))
      .where(eq(householdUsers.userId, userId));

    // Get member counts for each household
    const householdIds = userHouseholds.map(h => h.id);

    if (householdIds.length === 0) {
      return [];
    }

    // Count members for all households in a single query using GROUP BY
    const memberCounts = await db
      .select({
        householdId: householdUsers.householdId,
        count: db.$count(householdUsers.householdId),
      })
      .from(householdUsers)
      .where(inArray(householdUsers.householdId, householdIds))
      .groupBy(householdUsers.householdId);

    const countMap = new Map(memberCounts.map(mc => [mc.householdId, mc.count]));

    return userHouseholds.map(h => ({
      id: h.id,
      name: h.name,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      memberCount: countMap.get(h.id) || 1,
      isAdmin: h.userRole === 'owner',
    }));
  }

  /**
   * Get all members of a household with their details
   * Validates: Requirements 3.4
   */
  static async getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    const result = await db
      .select({
        userId: users.id,
        email: users.email,
        role: householdUsers.role,
        joinedAt: householdUsers.createdAt,
      })
      .from(householdUsers)
      .innerJoin(users, eq(householdUsers.userId, users.id))
      .where(eq(householdUsers.householdId, householdId));

    return result.map(row => ({
      userId: row.userId,
      email: row.email,
      role: row.role as 'owner' | 'member',
      joinedAt: row.joinedAt,
    }));
  }

  /**
   * Create an invitation for a user to join a household
   * The invited user must accept the invitation before becoming a member
   * Validates: Requirements 3.3
   */
  static async createInvitation(householdId: string, email: string, invitedBy: string): Promise<HouseholdInvitation> {
    // First verify the inviter is a member of the household
    const [membership] = await db
      .select()
      .from(householdUsers)
      .where(and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, invitedBy),
      ))
      .limit(1);

    if (!membership) {
      throw new Error('Only household members can invite others');
    }

    // Check if user exists and is already a member
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser) {
      const [existingMember] = await db
        .select()
        .from(householdUsers)
        .where(and(
          eq(householdUsers.householdId, householdId),
          eq(householdUsers.userId, existingUser.id),
        ))
        .limit(1);

      if (existingMember) {
        throw new Error('User is already a member of this household');
      }
    }

    // Check for existing pending invitation
    const [existingInvitation] = await db
      .select()
      .from(householdInvitations)
      .where(and(
        eq(householdInvitations.householdId, householdId),
        eq(householdInvitations.invitedEmail, email),
        eq(householdInvitations.status, 'pending'),
      ))
      .limit(1);

    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    // Create invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invitation] = await db.insert(householdInvitations).values({
      householdId,
      invitedByUserId: invitedBy,
      invitedEmail: email,
      token,
      expiresAt,
    }).returning();

    return invitation;
  }

  /**
   * Remove a member from a household
   * Validates: Requirements 3.5
   */
  static async removeMember(householdId: string, userId: string, removedBy: string): Promise<void> {
    // Verify the remover is the owner
    const isOwnerResult = await this.isOwner(householdId, removedBy);
    if (!isOwnerResult) {
      throw new Error('Only household owners can remove members');
    }

    // Prevent owner from removing themselves
    if (userId === removedBy) {
      throw new Error('Owners cannot remove themselves. Delete the household instead.');
    }

    // Delete the household_users record
    await db
      .delete(householdUsers)
      .where(and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, userId),
      ));
  }

  /**
   * Delete a household (owner only)
   * Validates: Requirements 3.5
   */
  static async deleteHousehold(householdId: string, userId: string): Promise<void> {
    // Verify the user is the owner
    const isOwnerResult = await this.isOwner(householdId, userId);
    if (!isOwnerResult) {
      throw new Error('Only household owners can delete households');
    }

    // Delete the household (cascade will handle household_users)
    await db.delete(households).where(eq(households.id, householdId));
  }

  /**
   * Allow a member to leave a household (non-owners only)
   */
  static async leaveMember(householdId: string, userId: string): Promise<void> {
    // Check if user is owner
    const isOwnerResult = await this.isOwner(householdId, userId);
    if (isOwnerResult) {
      throw new Error('Owners cannot leave the household. Delete the household instead.');
    }

    // Delete the household_users record
    await db
      .delete(householdUsers)
      .where(and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, userId),
      ));
  }

  /**
   * Check if a user is the owner of a household
   */
  static async isOwner(householdId: string, userId: string): Promise<boolean> {
    const [householdUser] = await db
      .select()
      .from(householdUsers)
      .where(and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, userId),
        eq(householdUsers.role, 'owner'),
      ))
      .limit(1);

    return !!householdUser;
  }

  /**
   * Update a member's role in a household (owner only)
   * Note: Cannot change role of the owner
   */
  static async updateMemberRole(
    householdId: string,
    targetUserId: string,
    newRole: 'admin' | 'member',
    updatedBy: string,
  ): Promise<void> {
    // Verify the updater is the owner
    const isOwnerResult = await this.isOwner(householdId, updatedBy);
    if (!isOwnerResult) {
      throw new Error('Only household owners can update member roles');
    }

    // Check if target is the owner (cannot change owner role)
    const isTargetOwner = await this.isOwner(householdId, targetUserId);
    if (isTargetOwner) {
      throw new Error('Cannot change the role of the household owner');
    }

    // Update the member's role
    await db
      .update(householdUsers)
      .set({ role: newRole })
      .where(and(
        eq(householdUsers.householdId, householdId),
        eq(householdUsers.userId, targetUserId),
      ));
  }
}
