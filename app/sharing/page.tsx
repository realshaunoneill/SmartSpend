"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Navigation } from "@/components/navigation"
import { CreateHouseholdDialog } from "@/components/create-household-dialog"
import { HouseholdList } from "@/components/household-list"
import { HouseholdSelector } from "@/components/household-selector"
import { HouseholdMembersList } from "@/components/household-members-list"
import { Skeleton } from "@/components/ui/skeleton"
import { useHouseholds } from "@/lib/hooks/use-households"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Users } from "lucide-react"

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
  const { user, isLoaded } = useUser()
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()
  const queryClient = useQueryClient()
  
  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const response = await fetch("/api/users/me")
      if (!response.ok) throw new Error("Failed to fetch user")
      return response.json()
    },
    enabled: !!user,
  })

  // Get households
  const { data: households = [], isLoading: householdsLoading } = useHouseholds()

  const handleHouseholdCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["households"] })
  }

  // Get members for selected household
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["household-members", selectedHouseholdId],
    queryFn: async () => {
      if (!selectedHouseholdId) return []
      
      const response = await fetch(`/api/households/${selectedHouseholdId}/members`)
      if (!response.ok) throw new Error("Failed to fetch members")
      
      const data = await response.json()
      return data.map((member: any) => ({
        id: member.userId,
        user_id: member.userId,
        full_name: member.email.split('@')[0],
        email: member.email,
        role: member.role === 'owner' ? 'admin' : 'member',
        joined_at: member.joinedAt,
      }))
    },
    enabled: !!selectedHouseholdId,
  })

  // Select first household by default
  useEffect(() => {
    if (households.length > 0 && !selectedHouseholdId) {
      setSelectedHouseholdId(households[0].id)
    }
  }, [households, selectedHouseholdId])

  const selectedHousehold = households.find((h: any) => h.id === selectedHouseholdId)
  const currentUserId = currentUser?.id
  const isCurrentUserAdmin = selectedHousehold && currentUser ? 
    members.find((m: any) => m.user_id === currentUser.id)?.role === 'admin' : false

  if (!isLoaded || !user) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-6xl space-y-8 p-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              {!isLoaded ? "Loading..." : "Please sign in to manage households"}
            </p>
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
                selectedHouseholdId={selectedHouseholdId}
                onSelect={setSelectedHouseholdId}
              />
            )}
            <CreateHouseholdDialog 
              userId={currentUserId} 
              onHouseholdCreated={handleHouseholdCreated} 
            />
          </div>
        </div>

        {householdsLoading ? (
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
        ) : households.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No households yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first household to start sharing receipts with family members or roommates.
            </p>
            <CreateHouseholdDialog 
              userId={currentUserId} 
              onHouseholdCreated={handleHouseholdCreated}
            />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Your Households</h2>
              <HouseholdList
                households={households}
                currentUserId={currentUserId}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["households"] })
                }}
                onSelect={(household: any) => setSelectedHouseholdId(household.id)}
                selectedId={selectedHouseholdId}
              />
            </div>

            <div>
              {selectedHousehold && (
                <>
                  {membersLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <HouseholdMembersList
                      householdId={selectedHousehold.id}
                      members={members}
                      currentUserId={currentUserId}
                      isCurrentUserAdmin={isCurrentUserAdmin}
                      onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ["household-members", selectedHouseholdId] })
                      }}
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
