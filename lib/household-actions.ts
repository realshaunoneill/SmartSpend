"use server"

import type { Household } from "./types"

export async function createHousehold(data: { name: string; userId: string }) {
  // Mock create household
  await new Promise((resolve) => setTimeout(resolve, 500))

  const household: Household = {
    id: `household-${Date.now()}`,
    name: data.name,
    created_by: data.userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return household
}

export async function inviteMember(data: { householdId: string; email: string }) {
  // Mock send invite
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    inviteId: `invite-${Date.now()}`,
    email: data.email,
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export async function removeMember(data: { householdId: string; userId: string }) {
  // Mock remove member
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

export async function leaveHousehold(data: { householdId: string; userId: string }) {
  // Mock leave household
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

export async function updateMemberRole(data: {
  householdId: string
  userId: string
  role: "admin" | "member"
}) {
  // Mock update role
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

export async function deleteHousehold(householdId: string) {
  // Mock delete household
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}
