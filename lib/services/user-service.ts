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
}
