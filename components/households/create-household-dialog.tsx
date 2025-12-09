'use client';

import type React from 'react';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createHousehold } from '@/lib/household-actions';

interface CreateHouseholdDialogProps {
  userId: string
  onHouseholdCreated: () => void
}

export function CreateHouseholdDialog({ userId, onHouseholdCreated }: CreateHouseholdDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await createHousehold({ name: name.trim(), userId });
      onHouseholdCreated();
      setOpen(false);
      setName('');
    } catch (_error) {
      alert('Failed to create household');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Household
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Household</DialogTitle>
            <DialogDescription>Create a shared space for tracking receipts with family or roommates</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Household Name</Label>
            <Input
              id="name"
              placeholder="e.g., Family Budget, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
