import { ArrowDownLeft, ArrowUpRight, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BankTransaction } from "@/lib/types"

interface BankTransactionsListProps {
  transactions: BankTransaction[]
}

export function BankTransactionsList({ transactions }: BankTransactionsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowDownLeft className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">No transactions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Connect a bank account to see your transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      transaction.amount < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {transaction.amount < 0 ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{transaction.merchant_name || "Transaction"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.transaction_date)}
                      {transaction.category && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {transaction.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${transaction.amount < 0 ? "text-foreground" : "text-primary"}`}>
                    {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
