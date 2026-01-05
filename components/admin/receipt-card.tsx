'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Receipt, Home, Calendar, Mail, Eye, AlertCircle, Briefcase, Tag } from 'lucide-react';

interface ReceiptCardProps {
  receipt: {
    id: string
    merchantName: string
    totalAmount: string
    currency: string
    transactionDate: string
    userEmail: string
    householdName: string | null
    processingStatus: string
    processingError?: string | null
    category?: string | null
    isBusinessExpense?: boolean | null
    createdAt: string
  }
  onOpenReceipt: (receiptId: string) => void
}

export function ReceiptCard({ receipt, onOpenReceipt }: ReceiptCardProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onOpenReceipt(receipt.id)}
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium break-all">{receipt.merchantName || 'Unknown Merchant'}</span>
          <Badge
            variant={
              receipt.processingStatus === 'completed'
                ? 'default'
                : receipt.processingStatus === 'failed'
                ? 'destructive'
                : 'secondary'
            }
            className="shrink-0"
          >
            {receipt.processingStatus}
          </Badge>
          {receipt.processingStatus === 'failed' && receipt.processingError && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{receipt.processingError}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {receipt.isBusinessExpense && (
            <Badge variant="outline" className="gap-1 shrink-0 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400">
              <Briefcase className="h-3 w-3" />
              Business
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{receipt.userEmail}</span>
          </span>
          {receipt.householdName && (
            <span className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span className="truncate">{receipt.householdName}</span>
            </span>
          )}
          {receipt.category && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span className="capitalize">{receipt.category}</span>
            </span>
          )}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            {new Date(receipt.transactionDate || receipt.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="text-right">
          <div className="text-lg font-semibold whitespace-nowrap">
            {receipt.currency || '€'} {receipt.totalAmount || '0.00'}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            Uploaded {new Date(receipt.createdAt).toLocaleDateString()}
          </div>
        </div>
        <Eye className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
