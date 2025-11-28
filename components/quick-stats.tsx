import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, CreditCard, TrendingUp, Wallet } from "lucide-react"

interface QuickStatsProps {
  stats: {
    totalReceipts: number
    totalTransactions: number
    avgSpending: number
    topCategory: string
  }
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalReceipts}</div>
          <p className="text-xs text-muted-foreground">Uploaded this month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bank Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">Synced automatically</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">${stats.avgSpending.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Past 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize text-foreground">{stats.topCategory}</div>
          <p className="text-xs text-muted-foreground">Most frequent</p>
        </CardContent>
      </Card>
    </div>
  )
}
