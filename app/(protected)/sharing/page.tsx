'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { Navigation } from '@/components/layout/navigation';
import { CreateHouseholdDialog } from '@/components/households/create-household-dialog';
import { HouseholdList } from '@/components/households/household-list';
import { HouseholdSelector } from '@/components/households/household-selector';
import { HouseholdMembersList } from '@/components/households/household-members-list';
import { SubscriptionGate } from '@/components/subscriptions/subscription-gate';
import { Skeleton } from '@/components/ui/skeleton';
import { useHouseholds } from '@/lib/hooks/use-households';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HouseholdReceipts } from '@/components/households/household-receipts';
import { Users, Home, Share2, Receipt, Shield } from 'lucide-react';
import type { HouseholdWithMembers, MemberWithUser } from '@/lib/types/api-responses';

export default function SharingPage() {
  const { user, isSubscribed } = useUser();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();
  const queryClient = useQueryClient();

  // Get households
  const { data: households = [], isLoading: householdsLoading } = useHouseholds();

  const handleHouseholdCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['households'] });
  };

  // Get members for selected household
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['household-members', selectedHouseholdId],
    queryFn: async () => {
      if (!selectedHouseholdId) return [];

      const response = await fetch(`/api/households/${selectedHouseholdId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');

      const data = await response.json();
      return data.map((member: MemberWithUser) => ({
        id: member.user_id,
        user_id: member.user_id,
        full_name: member.email.split('@')[0],
        email: member.email,
        role: member.role === 'owner' ? 'admin' : 'member',
        joined_at: member.joined_at,
      }));
    },
    enabled: !!selectedHouseholdId,
  });

  // Select first household by default
  useEffect(() => {
    if (households.length > 0 && !selectedHouseholdId) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId]);

  const selectedHousehold = households.find((h: HouseholdWithMembers) => h.id === selectedHouseholdId);
  const currentUserId = user?.id;
  const isCurrentUserAdmin = selectedHousehold && user ?
    members.find((m: { user_id: string; role: string }) => m.user_id === user.id)?.role === 'admin' : false;

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Sharing</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
              {isSubscribed
                ? 'Manage households and share receipts with family or roommates'
                : 'View your households and shared receipts'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            {households.length > 0 && (
              <HouseholdSelector
                households={households}
                selectedHouseholdId={selectedHouseholdId}
                onSelect={setSelectedHouseholdId}
              />
            )}
            {isSubscribed ? (
              <CreateHouseholdDialog
                onHouseholdCreated={handleHouseholdCreated}
              />
            ) : (
              <SubscriptionGate feature="sharing" variant="inline">
                <CreateHouseholdDialog
                  onHouseholdCreated={handleHouseholdCreated}
                />
              </SubscriptionGate>
            )}
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
          isSubscribed ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-8">
                  <Home className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-1">
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Create Your First Household</h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Households let you share receipts and track expenses with family, partners, or roommates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Share2 className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground text-center">Share receipts instantly</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Receipt className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground text-center">Track shared expenses</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground text-center">Manage permissions</p>
                </div>
              </div>
              <CreateHouseholdDialog
                onHouseholdCreated={handleHouseholdCreated}
              />
            </div>
          ) : (
            <SubscriptionGate feature="sharing" />
          )
        ) : (
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Your Households</h2>
                <HouseholdList
                  households={households}
                  currentUserId={currentUserId!}
                  isSubscribed={isSubscribed}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['households'] });
                  }}
                  onSelect={(household) => setSelectedHouseholdId(household.id)}
                  selectedId={selectedHouseholdId}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Members</h2>
                {selectedHousehold ? (
                  <>
                    {membersLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : (
                      <HouseholdMembersList
                        householdId={selectedHousehold.id}
                        members={members}
                        currentUserId={currentUserId!}
                        isCurrentUserAdmin={isCurrentUserAdmin}
                        isSubscribed={isSubscribed}
                        onUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ['household-members', selectedHouseholdId] });
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Select a household</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose a household to view and manage its members
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Household Receipts */}
            {selectedHousehold && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedHousehold.name} Receipts
                </h2>
                <HouseholdReceipts householdId={selectedHousehold.id} />
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
