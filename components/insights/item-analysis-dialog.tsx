"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useItemAnalysis, type ItemAnalysis } from "@/hooks/use-item-analysis";
import { Loader2, TrendingUp, ShoppingCart, Calendar, Store, ShoppingBag, AlertCircle, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemAnalysisDialogProps {
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId?: string;
}

export function ItemAnalysisDialog({
  itemName,
  open,
  onOpenChange,
  householdId,
}: ItemAnalysisDialogProps) {
  const [months, setMonths] = useState(12);

  const { data: analysis, isLoading, error, refetch } = useItemAnalysis({
    itemName,
    householdId,
    months,
    enabled: open && !!itemName,
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 overflow-hidden border-0"
        style={{
          maxWidth: "1200px",
          width: "90vw",
          maxHeight: "90vh",
          height: "90vh",
        }}
      >
        <div className="h-full overflow-y-auto p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6" />
              Spending Analysis: {itemName}
            </DialogTitle>
            <DialogDescription className="text-base">
              View your spending patterns for this item over time
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Unable to Load Analysis
                </CardTitle>
                <CardDescription>
                  We couldn't retrieve spending data for this item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-background/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Error Details:</p>
                  <p className="text-sm text-muted-foreground">
                    {error.message || "An unexpected error occurred"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Possible reasons:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>This item hasn't been purchased in the selected time period</li>
                    <li>The item name doesn't match any records in your receipts</li>
                    <li>There may be a temporary connection issue</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => onOpenChange(false)} 
                    variant="secondary" 
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && !isLoading && (
            <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Total Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.summary.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.summary.totalQuantity.toFixed(1)} items total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analysis.summary.currency} {analysis.summary.totalSpent.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {analysis.summary.currency} {analysis.summary.averagePrice.toFixed(2)} per purchase
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Time Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.searchPeriod.months} months</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(analysis.searchPeriod.startDate).toLocaleDateString()} - {new Date(analysis.searchPeriod.endDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Item Variants */}
            {analysis.itemVariants && analysis.itemVariants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Item Variants
                  </CardTitle>
                  <CardDescription>
                    {analysis.itemVariants.length === 1 
                      ? "Single item found" 
                      : `${analysis.itemVariants.length} related items found`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.itemVariants.map((variant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{variant.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {variant.count} purchase{variant.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">
                            {analysis.summary.currency} {variant.totalSpent.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg: {analysis.summary.currency} {variant.averagePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Merchants */}
            {analysis.topMerchants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Merchants
                  </CardTitle>
                  <CardDescription>Where you've purchased these items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.topMerchants.map((merchant, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="font-medium">{merchant.merchant}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Last Purchase */}
            {analysis.recentPurchases.length > 0 && analysis.recentPurchases[0].date && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Purchase</CardTitle>
                  <CardDescription>Most recent purchase of this item</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{analysis.recentPurchases[0].merchant}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(analysis.recentPurchases[0].date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleRefresh} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh
              </Button>
            </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
