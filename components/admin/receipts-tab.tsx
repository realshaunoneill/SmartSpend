'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptCard } from './receipt-card';

interface AdminReceipt {
  id: string;
  merchantName: string;
  totalAmount: string;
  currency: string;
  transactionDate: string;
  userEmail: string;
  householdName: string | null;
  processingStatus: string;
  createdAt: string;
}

interface ReceiptsTabProps {
  receipts: AdminReceipt[]
  onOpenReceipt: (receiptId: string) => void
}

export function ReceiptsTab({ receipts, onOpenReceipt }: ReceiptsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Receipts</CardTitle>
        <CardDescription>View all receipt submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onOpenReceipt={onOpenReceipt}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
