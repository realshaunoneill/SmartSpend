import { clerkClient } from '@clerk/nextjs/server'

/**
 * Get user email from Clerk
 */
export async function getClerkUserEmail(clerkId: string): Promise<string | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(clerkId)
    return user.emailAddresses[0]?.emailAddress ?? null
  } catch (error) {
    console.error('Error fetching Clerk user:', error)
    return null
  }
}
