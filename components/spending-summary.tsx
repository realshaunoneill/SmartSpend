"use client"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SpendingSummaryProps {
  data: {
    total: number
    change: number
    byCategory: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  period: "week" | "month" | "year"
  onPeriodChange: (period: "week" | "month" | "year") => void
}

export function SpendingSummary({ data, period, onPeriodChange }: SpendingSummaryProps) {
  const isPositiveChange = data.change >= 0
  const periodLabels = {
    week: "This Week",
    month: "This Month",
    year: "This Year",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Total Spending</CardTitle>
            <CardDescription>{periodLabels[period]}</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Amount */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">
            ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositiveChange ? "text-destructive" : "text-primary"
            }`}
          >
            {isPositiveChange ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(data.change)}%
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">By Category</h4>
          <div className="space-y-3">
            {data.byCategory.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{item.category}</span>
                  <span className="font-medium text-foreground">${item.amount.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
