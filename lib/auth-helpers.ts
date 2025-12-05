import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { submitLogEvent } from '@/lib/logging'
import { UserService } from '@/lib/services/user-service'

/**
 * Get user email from Clerk
 */
export async function getClerkUserEmail(clerkId: string): Promise<string | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(clerkId)
    return user.emailAddresses[0]?.emailAddress ?? null
  } catch (error) {
    submitLogEvent('auth', `Error fetching Clerk user: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { clerkId }, true)
    return null
  }
}

/**
 * Get or create authenticated user from database
 * Returns user object or NextResponse error
 */
export async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = await getClerkUserEmail(clerkId)
  if (!email) {
    return NextResponse.json({ error: "User email not found" }, { status: 400 })
  }

  try {
    const user = await UserService.getOrCreateUser(clerkId, email)
    return { user, clerkId }
  } catch (error) {
    submitLogEvent('auth', `Error getting/creating user: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { clerkId }, true)
    return NextResponse.json({ error: "Failed to authenticate user" }, { status: 500 })
  }
}

/**
 * Check if user has an active subscription
 * Returns null if subscribed, or NextResponse error if not
 */
export async function requireSubscription(userOrResult: any) {
  // If it's already an error response, return it
  if (userOrResult instanceof NextResponse) {
    return userOrResult
  }

  const user = userOrResult.user || userOrResult

  const skipSubscriptionCheck = process.env.SKIP_SUBSCRIPTION_CHECK === "true"
  
  if (!skipSubscriptionCheck && !user.subscribed) {
    return NextResponse.json(
      { error: "Active subscription required" },
      { status: 403 }
    )
  }

  return null
}
