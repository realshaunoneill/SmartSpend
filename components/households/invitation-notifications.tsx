'use client';

import { useState } from 'react';
import { Bell, Check, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useInvitations, useAcceptInvitation } from '@/lib/hooks/use-invitations';
import { toast } from 'sonner';

export function InvitationNotifications() {
  const { data: invitations = [], isLoading } = useInvitations();
  const acceptInvitation = useAcceptInvitation();
  const [isOpen, setIsOpen] = useState(false);

  const handleInvitationAction = async (
    invitationId: string,
    action: 'accept' | 'decline',
    householdName: string,
  ) => {
    try {
      await acceptInvitation.mutateAsync({ invitationId, action });

      if (action === 'accept') {
        toast.success(`Joined ${householdName} successfully!`);
      } else {
        toast.success('Invitation declined');
      }

      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process invitation');
    }
  };

  if (isLoading) return null;

  const pendingCount = invitations.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {pendingCount === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No pending invitations
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-3 py-2 text-sm font-semibold border-b">
              Household Invitations ({pendingCount})
            </div>
            {invitations.map((invitation: any) => (
              <div key={invitation.id} className="p-3 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Join "{invitation.householdName}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleInvitationAction(
                        invitation.id,
                        'accept',
                        invitation.householdName,
                      )
                    }
                    disabled={acceptInvitation.isPending}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleInvitationAction(
                        invitation.id,
                        'decline',
                        invitation.householdName,
                      )
                    }
                    disabled={acceptInvitation.isPending}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
