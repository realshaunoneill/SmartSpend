import { db } from '@/lib/db'
import { users, type User, type NewUser } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export class UserService {
  /**
   * Create a new user in the database
   */
  static async createUser(clerkId: string, email: string): Promise<User> {
    const newUser: NewUser = {
      clerkId,
      email,
      subscribed: false,
    }

    const [user] = await db.insert(users).values(newUser).returning()
    return user
  }

  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    return user || null
  }

  /**
   * Get or create user by Clerk ID
   * If user doesn't exist, creates a new user with the provided email
   * Returns the user with their subscription status
   */
  static async getOrCreateUser(clerkId: string, email: string): Promise<User> {
    // Try to find existing user
    let user = await this.getUserByClerkId(clerkId)

    // If user doesn't exist, create them
    if (!user) {
      user = await this.createUser(clerkId, email)
    }

    return user
  }

  /**
   * Update user subscription status
   */
  static async updateSubscriptionStatus(userId: string, subscribed: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ subscribed, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()
    return user
  }

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    return user || null
  }

  /**
   * Get user by email address
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user || null
  }
}
