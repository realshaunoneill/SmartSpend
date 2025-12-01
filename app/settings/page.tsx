"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import { useUser as useUserData } from "@/lib/hooks/use-user"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { user: userData, isLoading: userDataLoading } = useUserData()
  const [isUpdating, setIsUpdating] = useState(false)
  const queryClient = useQueryClient()

  const handleUpgrade = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast.error("Failed to start checkout. Please try again.")
      setIsUpdating(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsUpdating(true)
    try {
      // TODO: Implement Stripe Customer Portal
      // For now, show a message
      toast.info("Subscription management coming soon! Contact support to manage your subscription.")
      setIsUpdating(false)
    } catch (error) {
      console.error("Error managing subscription:", error)
      toast.error("Failed to open subscription management.")
      setIsUpdating(false)
    }
  }

  if (!isLoaded || userDataLoading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-4xl space-y-8 p-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!clerkUser) {
    return null
  }



  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-4xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information from Clerk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={clerkUser.fullName || "Not set"} 
                disabled 
              />
              <p className="text-xs text-muted-foreground">
                To update your name, please use your Clerk account settings
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={clerkUser.emailAddresses[0]?.emailAddress || "No email"} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clerk-id">User ID</Label>
              <Input 
                id="clerk-id" 
                value={clerkUser.id} 
                disabled 
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your SmartSpend subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {userData?.subscribed ? "Premium Plan" : "Free Plan"}
                      </p>
                      <Badge variant={userData?.subscribed ? "default" : "secondary"}>
                        {userData?.subscribed ? "Premium" : "Free"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {userData?.subscribed 
                        ? "Unlimited receipts, advanced analytics, and household sharing" 
                        : "Limited to 50 receipts per month"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!userData?.subscribed ? (
                    <Button 
                      onClick={handleUpgrade}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Processing..." : "Upgrade to Premium"}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={isUpdating}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </div>
              
              {userData?.subscribed && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-medium text-sm">Premium Features</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Unlimited receipt storage
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Advanced spending analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Household sharing & collaboration
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Priority support
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your SmartSpend account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {userData?.createdAt 
                    ? new Date(userData.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">
                  {userData?.updatedAt 
                    ? new Date(userData.updatedAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Deleting your account will permanently remove all your data, including receipts, households, and settings. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete Account (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
