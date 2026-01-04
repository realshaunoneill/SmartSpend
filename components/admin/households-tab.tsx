'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HouseholdCard } from './household-card';
import { Search, Home, SortAsc, SortDesc, Users, Receipt } from 'lucide-react';
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

type SortField = 'name' | 'createdAt' | 'memberCount' | 'receiptCount';

export function HouseholdsTab({
  households,
  expandedHouseholds,
  householdDetails,
  householdReceipts,
  onToggleHousehold,
  onOpenReceipt,
}: HouseholdsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedHouseholds = useMemo(() => {
    let result = [...households];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(household =>
        household.name.toLowerCase().includes(query) ||
        household.ownerEmail.toLowerCase().includes(query) ||
        household.id.toLowerCase().includes(query)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'memberCount':
          comparison = a.memberCount - b.memberCount;
          break;
        case 'receiptCount':
          comparison = a.receiptCount - b.receiptCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [households, searchQuery, sortField, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const totalStats = useMemo(() => ({
    totalMembers: households.reduce((sum, h) => sum + h.memberCount, 0),
    totalReceipts: households.reduce((sum, h) => sum + h.receiptCount, 0),
  }), [households]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              All Households
            </CardTitle>
            <CardDescription>
              {filteredAndSortedHouseholds.length} of {households.length} households
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {totalStats.totalMembers} members
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Receipt className="h-3 w-3" />
              {totalStats.totalReceipts} receipts
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="memberCount">Members</SelectItem>
                <SelectItem value="receiptCount">Receipts</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              title={sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Household List */}
        <div className="space-y-3">
          {filteredAndSortedHouseholds.length > 0 ? (
            filteredAndSortedHouseholds.map((household) => (
              <HouseholdCard
                key={household.id}
                household={household}
                isExpanded={expandedHouseholds.has(household.id)}
                onToggle={() => onToggleHousehold(household.id)}
                householdDetails={householdDetails[household.id]}
                householdReceipts={householdReceipts[household.id]}
                onOpenReceipt={onOpenReceipt}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No households found matching your criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
