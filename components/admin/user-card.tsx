"use client"

import { Badge } from "@/components/ui/badge"
import { Loader2, Receipt, Home, Calendar, CreditCard, Mail, Eye, ChevronDown, ChevronUp } from "lucide-react"

interface UserCardProps {
  user: {
    id: string
    email: string
    subscribed: boolean
    isAdmin: boolean
    createdAt: string
    stripeCustomerId: string | null
    receiptCount: number
    householdCount: number
  }
  isExpanded: boolean
  onToggle: () => void
  userReceipts?: any[]
  onOpenReceipt: (receiptId: string) => void
}

export function UserCard({ user, isExpanded, onToggle, userReceipts, onOpenReceipt }: UserCardProps) {
  return (
    <div className="rounded-lg border">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium break-all">{user.email}</span>
            {user.isAdmin && (
              <Badge variant="destructive">Admin</Badge>
            )}
            {user.subscribed && (
              <Badge variant="default">Subscribed</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Receipt className="h-3 w-3" />
              {user.receiptCount} receipts
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Home className="h-3 w-3" />
              {user.householdCount} households
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {user.stripeCustomerId && (
            <Badge variant="outline" className="gap-1">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Stripe Customer</span>
              <span className="sm:hidden">Stripe</span>
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="border-t p-4 bg-muted/20">
          <h4 className="text-sm font-semibold mb-3">User Receipts</h4>
          {userReceipts ? (
            userReceipts.length > 0 ? (
              <div className="space-y-2">
                {userReceipts.map((receipt: any) => (
                  <div
                    key={receipt.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md bg-background p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenReceipt(receipt.id)
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Receipt className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{receipt.merchantName || "Unknown"}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {receipt.processingStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      <span className="text-sm font-medium">
                        {receipt.currency} {receipt.totalAmount}
                      </span>
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No receipts found</p>
            )
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
