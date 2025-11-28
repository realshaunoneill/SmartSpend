"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { CreateHouseholdDialog } from "@/components/create-household-dialog"
import { HouseholdCard } from "@/components/household-card"
import { HouseholdMembersList } from "@/components/household-members-list"
import type { Household } from "@/lib/types"

// Mock data
const mockHouseholds: Array<Household & { memberCount: number; isAdmin: boolean }> = [
  {
    id: "household-1",
    name: "Family Budget",
    created_by: "user-123",
    memberCount: 4,
    isAdmin: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "household-2",
    name: "Apartment 4B",
    created_by: "user-456",
    memberCount: 2,
    isAdmin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockMembers = [
  {
    id: "member-1",
    user_id: "user-123",
    full_name: "Demo User",
    email: "demo@smartspend.com",
    avatar_url: "/placeholder.svg?key=user1",
    role: "admin" as const,
    joined_at: new Date().toISOString(),
  },
  {
    id: "member-2",
    user_id: "user-456",
    full_name: "Jane Smith",
    email: "jane@example.com",
    avatar_url: "/placeholder.svg?key=user2",
    role: "member" as const,
    joined_at: new Date().toISOString(),
  },
  {
    id: "member-3",
    user_id: "user-789",
    full_name: "Bob Johnson",
    email: "bob@example.com",
    avatar_url: "/placeholder.svg?key=user3",
    role: "member" as const,
    joined_at: new Date().toISOString(),
  },
  {
    id: "member-4",
    user_id: "user-101",
    full_name: "Alice Williams",
    email: "alice@example.com",
    role: "admin" as const,
    joined_at: new Date().toISOString(),
  },
]

export default function SharingPage() {
  const [households, setHouseholds] = useState(mockHouseholds)
  const [selectedHousehold, setSelectedHousehold] = useState(mockHouseholds[0])
  const currentUserId = "user-123"

  const handleUpdate = () => {
    // In production, refetch data
    console.log("[v0] Would refetch households and members")
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-6xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Sharing</h1>
            <p className="mt-2 text-muted-foreground">Manage households and share receipts with family or roommates</p>
          </div>
          <CreateHouseholdDialog userId={currentUserId} onHouseholdCreated={handleUpdate} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Your Households</h2>
            {households.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">No households yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first household to start sharing receipts
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {households.map((household) => (
                  <div key={household.id} onClick={() => setSelectedHousehold(household)}>
                    <HouseholdCard household={household} currentUserId={currentUserId} onUpdate={handleUpdate} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {selectedHousehold && (
              <HouseholdMembersList
                householdId={selectedHousehold.id}
                members={mockMembers}
                currentUserId={currentUserId}
                isCurrentUserAdmin={selectedHousehold.isAdmin}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
