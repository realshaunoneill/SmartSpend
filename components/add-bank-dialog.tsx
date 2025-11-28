"use client"

import { useState } from "react"
import { Building2, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initiatePlaidConnection, initiateRevolutConnection, saveBankConnection } from "@/lib/bank-integration"

interface AddBankDialogProps {
  userId: string
  onBankAdded: () => void
}

export function AddBankDialog({ userId, onBankAdded }: AddBankDialogProps) {
  const [open, setOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState<"plaid" | "revolut" | null>(null)

  const handlePlaidConnect = async () => {
    setIsConnecting("plaid")
    try {
      // Step 1: Get Plaid Link token
      const { linkToken } = await initiatePlaidConnection()

      // Step 2: Simulate Plaid Link flow (in production, this opens Plaid's UI)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Step 3: Exchange public token
      const mockPublicToken = "public-sandbox-token"
      // In production: const publicToken would come from Plaid Link

      // Step 4: Save connection
      await saveBankConnection({
        userId,
        provider: "plaid",
        accountId: "account-mock-123",
        accountName: "Checking Account",
        institutionName: "Chase Bank",
        accessToken: "mock-access-token",
      })

      onBankAdded()
      setOpen(false)
    } catch (error) {
      alert("Failed to connect bank account")
    } finally {
      setIsConnecting(null)
    }
  }

  const handleRevolutConnect = async () => {
    setIsConnecting("revolut")
    try {
      // Step 1: Initiate OAuth flow
      const { authUrl } = await initiateRevolutConnection()

      // Step 2: Simulate OAuth (in production, redirect to Revolut)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Step 3: Save connection
      await saveBankConnection({
        userId,
        provider: "revolut",
        accountId: "revolut-account-456",
        accountName: "Revolut Account",
        institutionName: "Revolut",
        accessToken: "mock-revolut-token",
      })

      onBankAdded()
      setOpen(false)
    } catch (error) {
      alert("Failed to connect Revolut")
    } finally {
      setIsConnecting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Your Bank</DialogTitle>
          <DialogDescription>Choose a provider to securely connect your bank account</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={handlePlaidConnect}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Plaid</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Connect to 10,000+ banks and credit unions in the US and Canada</CardDescription>
              <Button className="mt-4 w-full" disabled={isConnecting !== null} onClick={handlePlaidConnect}>
                {isConnecting === "plaid" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Plaid"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-colors hover:border-primary" onClick={handleRevolutConnect}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Revolut</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Connect your Revolut account for seamless transaction syncing</CardDescription>
              <Button
                className="mt-4 w-full bg-transparent"
                variant="outline"
                disabled={isConnecting !== null}
                onClick={handleRevolutConnect}
              >
                {isConnecting === "revolut" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Revolut"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            Your bank credentials are encrypted and securely stored. SmartSpend uses industry-standard security
            protocols and never stores your banking passwords.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
