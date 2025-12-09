'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HouseholdCard } from './household-card';
import type { HouseholdWithMembers, ReceiptWithItems, MemberWithUser } from '@/lib/types/api-responses';

type HouseholdDetailsWithMembers = HouseholdWithMembers & {
  members?: MemberWithUser[];
};

type AdminHouseholdReceipt = ReceiptWithItems & {
  submitterEmail?: string;
};

interface HouseholdsTabProps {
  households: Array<{
    id: string
    name: string
    memberCount: number
    receiptCount: number
    createdAt: string
    ownerEmail: string
  }>
  expandedHouseholds: Set<string>
  householdDetails: Record<string, HouseholdDetailsWithMembers>
  householdReceipts: Record<string, AdminHouseholdReceipt[]>
  onToggleHousehold: (householdId: string) => void
  onOpenReceipt: (receiptId: string) => void
}

export function HouseholdsTab({
  households,
  expandedHouseholds,
  householdDetails,
  householdReceipts,
  onToggleHousehold,
  onOpenReceipt,
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
  );
}
