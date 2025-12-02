import { clerkClient } from '@clerk/nextjs/server'
import { submitLogEvent } from '@/lib/logging'

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
