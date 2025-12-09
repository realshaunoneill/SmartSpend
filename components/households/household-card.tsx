'use client';

import { Users, Crown, MoreVertical, Trash2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InviteMemberDialog } from '@/components/households/invite-member-dialog';
import type { Household } from '@/lib/types';
import { leaveHousehold, deleteHousehold } from '@/lib/household-actions';

interface HouseholdCardProps {
  household: Household & {
    memberCount: number
    isAdmin: boolean
  }
  currentUserId: string
  isSubscribed?: boolean
  onUpdate: () => void
}

export function HouseholdCard({ household, currentUserId, isSubscribed = false, onUpdate }: HouseholdCardProps) {
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this household?')) return;

    try {
      await leaveHousehold({ householdId: household.id, userId: currentUserId });
      onUpdate();
    } catch (_error) {
      alert('Failed to leave household');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this household? This action cannot be undone.')) return;

    try {
      await deleteHousehold(household.id);
      onUpdate();
    } catch (_error) {
      alert('Failed to delete household');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {household.name}
                {household.isAdmin && (
                  <Badge variant="secondary" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {household.memberCount} {household.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {isSubscribed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {household.isAdmin ? (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Household
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleLeave}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Household
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <InviteMemberDialog householdId={household.id} onMemberInvited={onUpdate} />
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Upgrade to Premium to manage household members
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
