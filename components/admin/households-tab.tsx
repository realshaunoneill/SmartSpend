"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HouseholdCard } from "./household-card"

interface HouseholdsTabProps {
  households: any[]
  expandedHouseholds: Set<string>
  householdDetails: Record<string, any>
  householdReceipts: Record<string, any[]>
  onToggleHousehold: (householdId: string) => void
  onOpenReceipt: (receiptId: string) => void
}

export function HouseholdsTab({ 
  households, 
  expandedHouseholds, 
  householdDetails,
  householdReceipts,
  onToggleHousehold, 
  onOpenReceipt 
}: HouseholdsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Households</CardTitle>
        <CardDescription>View household information and members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {households.map((household) => (
            <HouseholdCard
              key={household.id}
              household={household}
              isExpanded={expandedHouseholds.has(household.id)}
              onToggle={() => onToggleHousehold(household.id)}
              householdDetails={householdDetails[household.id]}
              householdReceipts={householdReceipts[household.id]}
              onOpenReceipt={onOpenReceipt}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
