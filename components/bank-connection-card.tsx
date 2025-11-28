"use client"

import { useState } from "react"
import { Building2, RefreshCw, Unplug, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BankConnection } from "@/lib/types"
import { syncBankTransactions, disconnectBank } from "@/lib/bank-integration"

interface BankConnectionCardProps {
  connection: BankConnection
  onDisconnect: () => void
}

export function BankConnectionCard({ connection, onDisconnect }: BankConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string>()

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncMessage(undefined)
    try {
      const result = await syncBankTransactions(connection.id)
      setSyncMessage(`Synced ${result.synced} transactions`)
      setTimeout(() => setSyncMessage(undefined), 3000)
    } catch (error) {
      setSyncMessage("Failed to sync")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this bank account?")) return

    setIsDisconnecting(true)
    try {
      await disconnectBank(connection.id)
      onDisconnect()
    } catch (error) {
      alert("Failed to disconnect")
    } finally {
      setIsDisconnecting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{connection.institution_name || "Bank Account"}</h3>
                <Badge
                  variant={connection.is_active ? "default" : "secondary"}
                  className={connection.is_active ? "bg-primary" : ""}
                >
                  {connection.is_active ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{connection.account_name || connection.account_id}</p>
              <p className="text-xs text-muted-foreground">Last synced: {formatDate(connection.last_synced_at)}</p>
              {syncMessage && <p className="text-xs font-medium text-primary">{syncMessage}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing || !connection.is_active}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isDisconnecting}>
              <Unplug className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
