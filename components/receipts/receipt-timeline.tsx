'use client';

import { Calendar, Store, MapPin, Clock, CreditCard, Users, ChevronRight, Receipt as ReceiptIcon, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCategory } from '@/lib/utils/format-category';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay } from 'date-fns';
import type { ReceiptWithItems } from '@/lib/types/api-responses';
import { useCurrency } from '@/lib/hooks/use-currency';
import { cn } from '@/lib/utils';

interface ReceiptTimelineProps {
  receipts: ReceiptWithItems[];
  onReceiptClick: (receipt: ReceiptWithItems) => void;
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
  gas: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  coffee: 'bg-amber-600/10 text-amber-800 dark:text-amber-300 border-amber-600/20',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const categoryIcons: Record<string, string> = {
  groceries: '🛒',
  dining: '🍽️',
  transportation: '🚗',
  shopping: '🛍️',
  utilities: '💡',
  entertainment: '🎬',
  healthcare: '💊',
  travel: '✈️',
  gas: '⛽',
  coffee: '☕',
  other: '📄',
};

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE'); // Monday, Tuesday, etc.
  if (isThisMonth(date)) return format(date, 'MMMM d'); // January 15
  return format(date, 'MMMM d, yyyy'); // January 15, 2025
}

function getDateSubtitle(date: Date): string {
  if (isToday(date) || isYesterday(date)) {
    return format(date, 'EEEE, MMMM d');
  }
  if (isThisWeek(date)) {
    return format(date, 'MMMM d');
  }
  return format(date, 'EEEE');
}

interface GroupedReceipts {
  label: string;
  subtitle: string;
  date: Date;
  receipts: ReceiptWithItems[];
  totalSpent: number;
  currency: string;
}

function groupReceiptsByDate(receipts: ReceiptWithItems[]): GroupedReceipts[] {
  const groups: Record<string, { receipts: ReceiptWithItems[]; date: Date; totalSpent: number; currency: string }> = {};

  receipts.forEach(receipt => {
    let dateStr: string | undefined;

    if (receipt.transactionDate) {
      dateStr = receipt.transactionDate;
    } else if (receipt.createdAt) {
      dateStr = typeof receipt.createdAt === 'string'
        ? receipt.createdAt
        : receipt.createdAt.toISOString();
    }

    if (!dateStr) return;

    const date = parseISO(dateStr);
    const dayKey = startOfDay(date).toISOString();

    if (!groups[dayKey]) {
      groups[dayKey] = { receipts: [], date, totalSpent: 0, currency: receipt.currency || 'EUR' };
    }
    groups[dayKey].receipts.push(receipt);
    groups[dayKey].totalSpent += parseFloat(receipt.totalAmount || '0');
  });

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([_, group]) => ({
      label: getDateLabel(group.date),
      subtitle: getDateSubtitle(group.date),
      date: group.date,
      receipts: group.receipts,
      totalSpent: group.totalSpent,
      currency: group.currency,
    }));
}

export function ReceiptTimeline({ receipts, onReceiptClick }: ReceiptTimelineProps) {
  const { format: formatCurrency } = useCurrency();
  const groupedReceipts = groupReceiptsByDate(receipts);

  if (receipts.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ReceiptIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No receipts found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload your first receipt to start building your spending timeline
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedReceipts.map((group, groupIndex) => (
        <div key={group.date.toISOString()} className="relative">
          {/* Date header */}
          <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border-2 border-primary">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{group.label}</h3>
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {group.receipts.length} receipt{group.receipts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(group.totalSpent)}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt cards for this date */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.receipts.map((receipt) => {
              const categoryKey = receipt.category?.toLowerCase() || 'other';
              const categoryClass = categoryColors[categoryKey] || categoryColors.other;
              const categoryIcon = categoryIcons[categoryKey] || categoryIcons.other;
              
              const isProcessing = receipt.processingStatus === 'pending' || receipt.processingStatus === 'processing';
              const isFailed = receipt.processingStatus === 'failed';

              return (
                <Card
                  key={receipt.id}
                  onClick={() => onReceiptClick(receipt)}
                  className={cn(
                    'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden',
                    isFailed && 'border-red-500/50 bg-red-500/5',
                    isProcessing && 'border-yellow-500/50 bg-yellow-500/5'
                  )}
                >
                  <CardContent className="p-0">
                    {/* Top section with thumbnail and main info */}
                    <div className="flex gap-3 p-4">
                      {/* Receipt thumbnail */}
                      <div className="shrink-0">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                          {receipt.imageUrl ? (
                            <img
                              src={receipt.imageUrl}
                              alt={`Receipt from ${receipt.merchantName || 'merchant'}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              {categoryIcon}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                              {receipt.merchantName || 'Unknown Merchant'}
                            </h4>
                            {receipt.location && (
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {receipt.location}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Amount */}
                        <p className="text-xl font-bold mt-2">
                          {receipt.currency || '€'}{receipt.totalAmount || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom section with badges */}
                    <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
                      {/* Status badges */}
                      {isProcessing && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Processing
                        </Badge>
                      )}
                      {isFailed && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 text-xs">
                          Failed
                        </Badge>
                      )}

                      {/* Category badge */}
                      {receipt.category && !isProcessing && !isFailed && (
                        <Badge variant="outline" className={cn('text-xs', categoryClass)}>
                          {formatCategory(receipt.category)}
                        </Badge>
                      )}

                      {/* Time badge */}
                      {receipt.transactionDate && (
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(parseISO(receipt.transactionDate), 'h:mm a')}
                        </Badge>
                      )}

                      {/* Payment method */}
                      {receipt.paymentMethod && (
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {receipt.paymentMethod}
                        </Badge>
                      )}

                      {/* Household indicator */}
                      {receipt.householdId && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                          <Users className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
