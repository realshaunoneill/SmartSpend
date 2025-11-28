"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Navigation } from "@/components/navigation"
import { CreateHouseholdDialog } from "@/components/create-household-dialog"
import { HouseholdList } from "@/components/household-list"
import { HouseholdSelector } from "@/components/household-selector"
import { HouseholdMembersList } from "@/components/household-members-list"
import { Skeleton } from "@/components/ui/skeleton"
import type { Household } from "@/lib/types"

interface HouseholdWithDetails extends Household {
  memberCount: number
  isAdmin: boolean
}

interface Member {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  role: "admin" | "member"
  joined_at: string
}

export default function SharingPage() {
  const { user } = useUser()
  const [households, setHouseholds] = useState<HouseholdWithDetails[]>([])
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdWithDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMembersLoading, setIsMembersLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Fetch current user ID from database
  useEffect(() => {
    async function fetchCurrentUser() {
      if (!user) return

      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const userData = await response.json()
          setCurrentUserId(userData.id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }

    fetchCurrentUser()
  }, [user])

  // Fetch households
  const fetchHouseholds = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/households')
      if (response.ok) {
        const data = await response.json()
        
        // Fetch member count and role for each household
        const householdsWithDetails = await Promise.all(
          data.map(async (household: Household) => {
            try {
              const membersResponse = await fetch(`/api/households/${household.id}/members`)
              if (membersResponse.ok) {
                const membersData = await membersResponse.json()
                const memberCount = membersData.length
                const currentUserMember = membersData.find((m: any) => m.userId === currentUserId)
                const isAdmin = currentUserMember?.role === 'owner'
                
                return {
                  ...household,
                  memberCount,
                  isAdmin,
                }
              }
              return {
                ...household,
                memberCount: 0,
                isAdmin: false,
              }
            } catch {
              return {
                ...household,
                memberCount: 0,
                isAdmin: false,
              }
            }
          })
        )
        
        setHouseholds(householdsWithDetails)
        
        // Select first household by default
        if (householdsWithDetails.length > 0 && !selectedHousehold) {
          setSelectedHousehold(householdsWithDetails[0])
        }
      }
    } catch (error) {
      console.error('Error fetching households:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch members for selected household
  const fetchMembers = async (householdId: string) => {
    setIsMembersLoading(true)
    try {
      const response = await fetch(`/api/households/${householdId}/members`)
      if (response.ok) {
        const data = await response.json()
        
        // Transform the data to match the expected format
        const transformedMembers = data.map((member: any) => ({
          id: member.userId,
          user_id: member.userId,
          full_name: member.email.split('@')[0], // Use email prefix as name for now
          email: member.email,
          role: member.role === 'owner' ? 'admin' : 'member',
          joined_at: member.joinedAt,
        }))
        
        setMembers(transformedMembers)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setIsMembersLoading(false)
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchHouseholds()
    }
  }, [currentUserId])

  useEffect(() => {
    if (selectedHousehold) {
      fetchMembers(selectedHousehold.id)
    }
  }, [selectedHousehold])

  const handleUpdate = () => {
    fetchHouseholds()
    if (selectedHousehold) {
      fetchMembers(selectedHousehold.id)
    }
  }

  const handleHouseholdSelect = (householdId: string) => {
    const household = households.find(h => h.id === householdId)
    if (household) {
      setSelectedHousehold(household)
    }
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-6xl space-y-8 p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Please sign in to manage households</p>
          </div>
        </main>
      </>
    )
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
          <div className="flex items-center gap-4">
            {households.length > 0 && (
              <HouseholdSelector
                households={households}
                selectedHouseholdId={selectedHousehold?.id}
                onSelect={handleHouseholdSelect}
              />
            )}
            <CreateHouseholdDialog userId={currentUserId} onHouseholdCreated={handleUpdate} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Your Households</h2>
              <HouseholdList
                households={households}
                currentUserId={currentUserId}
                onUpdate={handleUpdate}
                onSelect={setSelectedHousehold}
                selectedId={selectedHousehold?.id}
              />
            </div>

            <div>
              {selectedHousehold && (
                <>
                  {isMembersLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <HouseholdMembersList
                      householdId={selectedHousehold.id}
                      members={members}
                      currentUserId={currentUserId}
                      isCurrentUserAdmin={selectedHousehold.isAdmin}
                      onUpdate={handleUpdate}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
