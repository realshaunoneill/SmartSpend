'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptCard } from './receipt-card';

interface ReceiptsTabProps {
  receipts: any[]
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
