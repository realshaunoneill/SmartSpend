"use client";

import { useState } from "react";
import { Check, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHouseholds } from "@/lib/hooks/use-households";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ReceiptAssignmentDialogProps {
  receiptId: string;
  currentHouseholdId?: string;
  children: React.ReactNode;
}

export function ReceiptAssignmentDialog({
  receiptId,
  currentHouseholdId,
  children,
}: ReceiptAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>(
    currentHouseholdId || "__personal__"
  );
  
  const { data: households = [] } = useHouseholds();
  const queryClient = useQueryClient();

  const assignReceipt = useMutation({
    mutationFn: async (householdId: string | null) => {
      const response = await fetch(`/api/receipts/${receiptId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign receipt");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      toast.success("Receipt assignment updated!");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAssign = () => {
    const householdId = selectedHouseholdId === "__personal__" ? null : selectedHouseholdId;
    assignReceipt.mutate(householdId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Assign to household
            </label>
            <Select
              value={selectedHouseholdId}
              onValueChange={setSelectedHouseholdId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select household or keep personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__personal__">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Receipt
                  </div>
                </SelectItem>
                {households.map((household: any) => (
                  <SelectItem key={household.id} value={household.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {household.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAssign}
              disabled={assignReceipt.isPending}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {assignReceipt.isPending ? "Assigning..." : "Assign Receipt"}
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