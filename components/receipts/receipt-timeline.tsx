'use client';

import { Calendar, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils/format-category';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface Receipt {
  id: string;
  merchantName?: string;
  totalAmount?: string;
  currency?: string;
  transactionDate?: string;
  category?: string;
  imageUrl?: string;
  location?: string;
  created_at?: string;
  householdName?: string;
  [key: string]: any;
}

interface ReceiptTimelineProps {
  receipts: Receipt[];
  onReceiptClick: (receipt: Receipt) => void;
}

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  dining: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  transportation: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  shopping: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  utilities: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  entertainment: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  healthcare: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  travel: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE'); // Monday, Tuesday, etc.
  if (isThisMonth(date)) return format(date, 'MMMM d'); // January 15
  return format(date, 'MMMM d, yyyy'); // January 15, 2025
}

function groupReceiptsByDate(receipts: Receipt[]) {
  const groups: Record<string, Receipt[]> = {};
  
  receipts.forEach(receipt => {
    const dateStr = receipt.transactionDate || receipt.created_at;
    if (!dateStr) return;
    
    const date = parseISO(dateStr);
    const label = getDateLabel(date);
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(receipt);
  });
  
  return groups;
}

export function ReceiptTimeline({ receipts, onReceiptClick }: ReceiptTimelineProps) {
  const groupedReceipts = groupReceiptsByDate(receipts);
  const dateLabels = Object.keys(groupedReceipts);

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No receipts found. Upload your first receipt to get started!
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-border" />

      {dateLabels.map((dateLabel) => (
        <div key={dateLabel} className="relative">
          {/* Date badge */}
          <div className="sticky top-4 z-10 mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm">
              {dateLabel}
            </div>
          </div>

          {/* Receipts for this date */}
          <div className="ml-16 space-y-4">
            {groupedReceipts[dateLabel].map((receipt) => {
              const categoryClass = categoryColors[receipt.category?.toLowerCase() || 'other'] || categoryColors.other;
              
              return (
                <div
                  key={receipt.id}
                  onClick={() => onReceiptClick(receipt)}
                  className="group relative cursor-pointer rounded-lg border-2 bg-card p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1"
                >
                  {/* Timeline connector dot */}
                  <div className="absolute -left-[45px] top-6 h-3 w-3 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />
                  
                  <div className="flex items-start gap-4">
                    {/* Receipt thumbnail */}
                    <div className="shrink-0">
                      <div className="h-20 w-20 overflow-hidden rounded-lg border-2 bg-muted">
                        {receipt.imageUrl ? (
                          <img
                            src={receipt.imageUrl}
                            alt={`Receipt from ${receipt.merchantName || 'merchant'}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Receipt info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-bold text-lg">
                            {receipt.merchantName || 'Unknown Merchant'}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {receipt.currency || '€'}{receipt.totalAmount || '0.00'}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {receipt.category && (
                          <Badge variant="outline" className={categoryClass}>
                            {formatCategory(receipt.category)}
                          </Badge>
                        )}
                        {receipt.transactionDate && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(parseISO(receipt.transactionDate), 'MMM d, h:mm a')}
                          </Badge>
                        )}
                        {receipt.householdName && (
                          <Badge variant="secondary" className="text-xs">
                            {receipt.householdName}
                          </Badge>
                        )}
                      </div>

                      {/* Additional info */}
                      {receipt.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {receipt.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
