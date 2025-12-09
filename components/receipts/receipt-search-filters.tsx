'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Store, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

export interface ReceiptFilters {
  search?: string
  category?: string
  merchant?: string
  minAmount?: string
  maxAmount?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: string
}

interface ReceiptSearchFiltersProps {
  filters: ReceiptFilters
  onFiltersChange: (filters: ReceiptFilters) => void
  onClearFilters: () => void
}

export function ReceiptSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ReceiptSearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ReceiptFilters>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'sortBy' && key !== 'sortOrder' && key !== 'search',
  ).length;

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
    setIsOpen(false);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value || undefined };
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Quick Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search receipts, merchants, or items..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Advanced Filters */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto px-6 sm:max-w-lg" side="right">
          <SheetHeader className="space-y-2 pb-4">
            <SheetTitle className="text-xl font-semibold">Filter Receipts</SheetTitle>
            <SheetDescription className="text-sm">
              Apply filters to narrow down your receipt search
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-6 pb-20">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <Select
                value={localFilters.category || 'all'}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    category: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Merchant Filter */}
            <div className="space-y-2">
              <Label htmlFor="merchant" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Merchant
              </Label>
              <Input
                id="merchant"
                placeholder="e.g., Walmart, Target..."
                value={localFilters.merchant || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    merchant: e.target.value || undefined,
                  })
                }
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minAmount || ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        minAmount: e.target.value || undefined,
                      })
                    }
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxAmount || ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        maxAmount: e.target.value || undefined,
                      })
                    }
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={localFilters.startDate || ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        startDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={localFilters.endDate || ''}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        endDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={localFilters.sortBy || 'date'}
                  onValueChange={(value) =>
                    setLocalFilters({ ...localFilters, sortBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={localFilters.sortOrder || 'desc'}
                  onValueChange={(value) =>
                    setLocalFilters({ ...localFilters, sortOrder: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 sm:relative sm:mt-6 sm:border-t-0 sm:p-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearAll}
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              <Button className="flex-1" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

        {/* Sort Quick Controls */}
        <Select
          value={filters.sortBy || 'date'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, sortBy: value })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="amount">Sort by Amount</SelectItem>
            <SelectItem value="merchant">Sort by Merchant</SelectItem>
          </SelectContent>
        </Select>
      </div>      {/* Search Tips */}
      {!filters.search && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
              <Search className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">
                Search by merchant, category, or product
              </p>
              <p className="text-xs text-muted-foreground">
                Try <span className="font-medium text-foreground">"Coke"</span>, <span className="font-medium text-foreground">"Walmart"</span>, or <span className="font-medium text-foreground">"groceries"</span> to find matching receipts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
