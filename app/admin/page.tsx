"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Receipt, 
  Home, 
  Loader2, 
  ShieldCheck,
  Calendar,
  CreditCard,
  Mail
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  subscribed: boolean
  isAdmin: boolean
  createdAt: string
  stripeCustomerId: string | null
  receiptCount: number
  householdCount: number
}

interface Household {
  id: string
  name: string
  memberCount: number
  receiptCount: number
  createdAt: string
  ownerEmail: string
}

interface ReceiptDetail {
  id: string
  merchantName: string
  totalAmount: string
  currency: string
  transactionDate: string
  userEmail: string
  householdName: string | null
  processingStatus: string
  createdAt: string
}

export default function AdminPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [receipts, setReceipts] = useState<ReceiptDetail[]>([])

  useEffect(() => {
    async function checkAdminAndFetchData() {
      if (!isLoaded) return

      try {
        const response = await fetch("/api/admin/check")
        if (!response.ok) {
          router.push("/dashboard")
          return
        }

        const data = await response.json()
        if (!data.isAdmin) {
          router.push("/dashboard")
          return
        }

        setIsAdmin(true)

        // Fetch all admin data
        const [usersRes, householdsRes, receiptsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/households"),
          fetch("/api/admin/receipts"),
        ])

        if (usersRes.ok) setUsers(await usersRes.json())
        if (householdsRes.ok) setHouseholds(await householdsRes.json())
        if (receiptsRes.ok) setReceipts(await receiptsRes.json())
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [isLoaded, router])

  if (!isLoaded || loading) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users, households, and receipts
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.subscribed).length} subscribed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Households</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{households.length}</div>
              <p className="text-xs text-muted-foreground">
                {households.reduce((sum, h) => sum + h.memberCount, 0)} total members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receipts.length}</div>
              <p className="text-xs text-muted-foreground">
                {receipts.filter(r => r.processingStatus === "completed").length} processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="households">Households</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.email}</span>
                          {user.isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {user.subscribed && (
                            <Badge variant="default">Subscribed</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {user.receiptCount} receipts
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {user.householdCount} households
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {user.stripeCustomerId && (
                        <Badge variant="outline" className="gap-1">
                          <CreditCard className="h-3 w-3" />
                          Stripe Customer
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="households" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Households</CardTitle>
                <CardDescription>View household information and members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {households.map((household) => (
                    <div
                      key={household.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{household.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {household.memberCount} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {household.receiptCount} receipts
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Owner: {household.ownerEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {new Date(household.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Receipts</CardTitle>
                <CardDescription>View all receipt submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{receipt.merchantName || "Unknown Merchant"}</span>
                          <Badge
                            variant={
                              receipt.processingStatus === "completed"
                                ? "default"
                                : receipt.processingStatus === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {receipt.processingStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {receipt.userEmail}
                          </span>
                          {receipt.householdName && (
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {receipt.householdName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(receipt.transactionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {receipt.currency} {receipt.totalAmount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {new Date(receipt.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
