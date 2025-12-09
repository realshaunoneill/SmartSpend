'use client';

import { ReceiptList } from '@/components/receipts/receipt-list';
import { ReceiptListSkeleton } from '@/components/receipts/receipt-list-skeleton';
import { useReceipts } from '@/lib/hooks/use-receipts';

interface HouseholdReceiptsProps {
  householdId: string;
}

export function HouseholdReceipts({ householdId }: HouseholdReceiptsProps) {
  const { receipts, isLoading, error } = useReceipts(householdId);

  if (isLoading) {
    return <ReceiptListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center p-12 text-destructive">
        Failed to load receipts
      </div>
    );
  }

  return <ReceiptList receipts={receipts} />;
}
