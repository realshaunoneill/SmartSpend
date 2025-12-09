'use client';

import { ShoppingBag, TrendingUp, Percent, Tag, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { capitalizeText } from '@/lib/utils/format-category';

interface ReceiptItemsListProps {
  items: any[]
  currency: string
  onAnalyzeItem: (itemName: string) => void
}

export function ReceiptItemsList({ items, currency, onAnalyzeItem }: ReceiptItemsListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <ShoppingBag className="h-4 w-4" />
        Items ({items.length})
      </div>
      <div className="space-y-1 pr-2">
        {items.map((item: any, index: number) => {
          const quantity = parseFloat(item.quantity) || 1;
          const totalPrice = parseFloat(item.price) || 0;
          const unitPrice = quantity > 1 ? totalPrice / quantity : null;
          const hasModifiers = item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0;

          return (
            <div
              key={index}
              className="py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors border-b last:border-0"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Item details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className="font-medium text-sm wrap-break-word">
                      {item.name}
                    </p>
                    {item.category && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                        {capitalizeText(item.category)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    {item.quantity && (
                      <span className="whitespace-nowrap">Qty: {item.quantity}</span>
                    )}
                    {unitPrice && quantity > 1 && (
                      <span className="whitespace-nowrap">@ {currency} {unitPrice.toFixed(2)} each</span>
                    )}
                    {item.description && (
                      <span className="italic wrap-break-word">{item.description}</span>
                    )}
                  </div>
                </div>

                {/* Right: Price and button */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.price && (
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {currency} {item.price}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onAnalyzeItem(item.name)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Analyze
                  </Button>
                </div>
              </div>

              {/* Modifiers/Sub-items */}
              {hasModifiers && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-muted pl-3">
                  {item.modifiers.map((modifier: any, modIndex: number) => {
                    const isDiscount = modifier.type === 'discount' || modifier.price < 0;
                    const isDeposit = modifier.type === 'deposit';
                    const isFee = modifier.type === 'fee';

                    return (
                      <div
                        key={modIndex}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          {isDiscount && <Percent className="h-3 w-3 text-green-600" />}
                          {isDeposit && <Tag className="h-3 w-3 text-blue-600" />}
                          {isFee && <Info className="h-3 w-3 text-orange-600" />}
                          <span className={`${isDiscount ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {modifier.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1 py-0 h-4 ${
                              isDiscount ? 'border-green-600/30 text-green-600' :
                              isDeposit ? 'border-blue-600/30 text-blue-600' :
                              isFee ? 'border-orange-600/30 text-orange-600' :
                              'border-muted-foreground/30'
                            }`}
                          >
                            {capitalizeText(modifier.type)}
                          </Badge>
                        </div>
                        <span className={`font-medium ${isDiscount ? 'text-green-600' : ''}`}>
                          {modifier.price >= 0 ? '+' : ''}{currency} {Math.abs(modifier.price).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
