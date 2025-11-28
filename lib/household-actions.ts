"use server"

import { auth } from '@clerk/nextjs/server'
import { HouseholdService } from '@/lib/services/household-service'
import { UserService } from '@/lib/services/user-service'
import type { Household } from "./types"

async function getCurrentUser() {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    throw new Error('Authentication required')
  }

  const user = await UserService.getUserByClerkId(clerkId)
  
  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export async function createHousehold(data: { name: string; userId: string }) {
  const user = await getCurrentUser()
  const household = await HouseholdService.createHousehold(user.id, data.name)
  return household
}

export async function inviteMember(data: { householdId: string; email: string }) {
  const user = await getCurrentUser()
  const householdUser = await HouseholdService.inviteMember(
    data.householdId,
    data.email,
    user.id
  )
  return householdUser
}

export async function removeMember(data: { householdId: string; userId: string }) {
  const user = await getCurrentUser()
  await HouseholdService.removeMember(data.householdId, data.userId, user.id)
  return { success: true }
}

export async function leaveHousehold(data: { householdId: string; userId: string }) {
  const user = await getCurrentUser()
  await HouseholdService.leaveMember(data.householdId, user.id)
  return { success: true }
}

export async function updateMemberRole(data: {
  householdId: string
  userId: string
  role: "admin" | "member"
}) {
  // This would need to be implemented in HouseholdService
  throw new Error('Update member role is not yet implemented')
}

export async function deleteHousehold(householdId: string) {
  const user = await getCurrentUser()
  await HouseholdService.deleteHousehold(householdId, user.id)
  return { success: true }
}
