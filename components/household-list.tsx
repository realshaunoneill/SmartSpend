"use client"

import { HouseholdCard } from "@/components/household-card"
import type { Household } from "@/lib/types"

interface HouseholdWithDetails extends Household {
  memberCount: number
  isAdmin: boolean
}

interface HouseholdListProps {
  households: HouseholdWithDetails[]
  currentUserId: string
  onUpdate: () => void
  onSelect?: (household: HouseholdWithDetails) => void
  selectedId?: string
}

export function HouseholdList({ 
  households, 
  currentUserId, 
  onUpdate,
  onSelect,
  selectedId
}: HouseholdListProps) {
  if (households.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">No households yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first household to start sharing receipts
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {households.map((household) => (
        <div 
          key={household.id} 
          onClick={() => onSelect?.(household)}
          className={`cursor-pointer transition-opacity ${
            selectedId && selectedId !== household.id ? 'opacity-60 hover:opacity-100' : ''
          }`}
        >
          <HouseholdCard 
            household={household} 
            currentUserId={currentUserId} 
            onUpdate={onUpdate} 
          />
        </div>
      ))}
    </div>
  )
}
