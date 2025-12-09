'use client';

import { useState } from 'react';
import { Check, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useHouseholds } from '@/lib/hooks/use-households';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { HouseholdWithMembers } from '@/lib/types/api-responses';

interface ReceiptAssignmentDialogProps {
  receiptId: string;
  currentHouseholdId?: string;
  isOwner?: boolean;
  canRemoveOnly?: boolean;
  children: React.ReactNode;
}

export function ReceiptAssignmentDialog({
  receiptId,
  currentHouseholdId,
  isOwner = true,
  canRemoveOnly = false,
  children,
}: ReceiptAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(
    currentHouseholdId || '__personal__',
  );

  const { data: households = [] } = useHouseholds() as { data: HouseholdWithMembers[] };
  const queryClient = useQueryClient();

  const assignReceipt = useMutation({
    mutationFn: async (householdId: string | null) => {
      const response = await fetch(`/api/receipts/${receiptId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign receipt');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt assignment updated!');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAssign = () => {
    const householdId = selectedHouseholdId === '__personal__' ? null : selectedHouseholdId;
    assignReceipt.mutate(householdId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {canRemoveOnly ? 'Remove Receipt from Household' : 'Assign Receipt to Household'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {canRemoveOnly
                ? 'Remove this receipt from the household?'
                : 'Choose where to share this receipt'
              }
            </label>
            <div className="space-y-2">
              {/* Current Selection Display */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                {selectedHouseholdId === '__personal__' ? (
                  <>
                    <div className="p-1.5 rounded-md bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Personal Receipt</p>
                      <p className="text-xs text-muted-foreground">Only visible to you</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {households.find(h => h.id === selectedHouseholdId)?.name || 'Unknown Household'}
                      </p>
                      <p className="text-xs text-muted-foreground">Shared with household</p>
                    </div>
                  </>
                )}
              </div>

              {/* Options */}
              <div className="space-y-1">
                {/* Personal option - always available for owners, only for removal for admins */}
                {(isOwner || canRemoveOnly) && (
                  <button
                    type="button"
                    onClick={() => setSelectedHouseholdId('__personal__')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedHouseholdId === '__personal__'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">
                        {canRemoveOnly ? 'Remove from Household' : 'Personal Receipt'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {canRemoveOnly ? 'Make this receipt private' : 'Only visible to you'}
                      </p>
                    </div>
                    {selectedHouseholdId === '__personal__' && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </button>
                )}

                {/* Household options - only for owners */}
                {isOwner && !canRemoveOnly && households.map(household => (
                  <button
                    key={household.id}
                    type="button"
                    onClick={() => setSelectedHouseholdId(household.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedHouseholdId === household.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{household.name}</p>
                      <p className="text-xs text-muted-foreground">Shared with household</p>
                    </div>
                    {selectedHouseholdId === household.id && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAssign}
              disabled={assignReceipt.isPending}
              className="flex-1"
              variant={canRemoveOnly ? 'destructive' : 'default'}
            >
              <Check className="h-4 w-4 mr-2" />
              {assignReceipt.isPending
                ? (canRemoveOnly ? 'Removing...' : 'Assigning...')
                : (canRemoveOnly ? 'Remove Receipt' : 'Save Changes')
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={assignReceipt.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
