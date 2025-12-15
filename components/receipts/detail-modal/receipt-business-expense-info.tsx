'use client';

import { Briefcase, Tag, FileText, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReceiptWithItems } from '@/lib/types/api-responses';

interface ReceiptBusinessExpenseInfoProps {
  receipt: ReceiptWithItems;
}

export function ReceiptBusinessExpenseInfo({ receipt }: ReceiptBusinessExpenseInfoProps) {
  if (!receipt.isBusinessExpense) {
    return null;
  }

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Briefcase className="h-4 w-4" />
          Business Expense Information
          {receipt.taxDeductible && (
            <Badge variant="secondary" className="ml-auto bg-green-500/10 text-green-700 dark:text-green-400">
              <Check className="h-3 w-3 mr-1" />
              Tax Deductible
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {receipt.businessCategory && (
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-foreground">Category</div>
              <div className="text-muted-foreground">{receipt.businessCategory}</div>
            </div>
          </div>
        )}
        
        {receipt.businessNotes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-foreground">Notes</div>
              <div className="text-muted-foreground whitespace-pre-wrap">{receipt.businessNotes}</div>
            </div>
          </div>
        )}
        
        {!receipt.businessCategory && !receipt.businessNotes && (
          <p className="text-muted-foreground italic">
            This receipt is marked as a business expense.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
