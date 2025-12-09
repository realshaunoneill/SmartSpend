'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTopItems } from '@/hooks/use-top-items';
import { Loader2, TrendingUp, ShoppingBag, Store, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ItemAnalysisDialog } from '@/components/insights/item-analysis-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TopItemsListProps {
  householdId?: string;
  autoLoad?: boolean;
}

export function TopItemsList({ householdId, autoLoad = false }: TopItemsListProps) {
  const [months, setMonths] = useState(12);
  const [sortBy, setSortBy] = useState<'frequency' | 'spending'>('frequency');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { data, isLoading, error, refetch } = useTopItems({
    householdId,
    months,
    sortBy,
    limit: 20,
    enabled: autoLoad,
  });

  const handleItemClick = (itemName: string) => {
    setSelectedItem(itemName);
    setShowAnalysis(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Items
              </CardTitle>
              <CardDescription>
                Your most frequently purchased items
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="text-sm border rounded-md px-2 py-1"
                disabled={isLoading}
              >
                <option value={1}>1 month</option>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
              {!data && !autoLoad && (
                <Button onClick={() => refetch()} disabled={isLoading} size="sm">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Load Items'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              {error.message || 'An error occurred'}
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pb-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">{data.summary.totalUniqueItems}</div>
                  <div className="text-xs text-muted-foreground">Unique Items</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">{data.summary.totalPurchases}</div>
                  <div className="text-xs text-muted-foreground">Total Purchases</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-xl font-bold">
                    {data.summary.currency} {data.summary.totalSpent}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
              </div>

              {/* Sort Tabs */}
              <Tabs
                value={sortBy}
                onValueChange={(value) => setSortBy(value as 'frequency' | 'spending')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="frequency">Most Frequent</TabsTrigger>
                  <TabsTrigger value="spending">Highest Spending</TabsTrigger>
                </TabsList>

                <TabsContent value={sortBy} className="mt-4">
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {data.topItems.map((item, index) => (
                      <div
                        key={index}
                        className="group flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleItemClick(item.name)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="h-3 w-3" />
                                {item.count} purchase{item.count !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                {item.merchantCount} merchant{item.merchantCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.lastPurchased).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">
                            {item.currency} {item.totalSpent.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg: {item.currency} {item.averagePrice.toFixed(2)}
                          </div>
                          {item.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!data && !isLoading && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Click "Load Items" to see your top purchases</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Analysis Dialog */}
      {selectedItem && (
        <ItemAnalysisDialog
          itemName={selectedItem}
          open={showAnalysis}
          onOpenChange={(open) => {
            setShowAnalysis(open);
            if (!open) {
              setSelectedItem(null);
            }
          }}
          householdId={householdId}
        />
      )}
    </>
  );
}
