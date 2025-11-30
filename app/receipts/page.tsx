"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ReceiptList } from "@/components/receipt-list"
import { ReceiptListSkeleton } from "@/components/receipt-list-skeleton"
import { HouseholdSelector } from "@/components/household-selector"
import { useUser } from "@clerk/nextjs"
import { useReceipts } from "@/lib/hooks/use-receipts"
import { useHouseholds } from "@/lib/hooks/use-households"

export default function ReceiptsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>()
  
  const { data: households = [] } = useHouseholds()
  const { receipts, isLoading, error, refetch } = useReceipts(selectedHouseholdId)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn || !user) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="container mx-auto max-w-6xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Receipts
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload and manage your receipts with automatic scanning
            </p>
          </div>
          
          {households.length > 0 && (
            <div className="flex items-center gap-4">
              <HouseholdSelector
                households={[
                  { id: "", name: "Personal Receipts" },
                  ...households
                ]}
                selectedHouseholdId={selectedHouseholdId || ""}
                onSelect={(id) => setSelectedHouseholdId(id || undefined)}
              />
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ReceiptUpload
              clerkId={user.id}
              userEmail={user.emailAddresses[0]?.emailAddress || ""}
              householdId={selectedHouseholdId}
              onUploadComplete={refetch}
            />
          </div>
          <div>
            {isLoading ? (
              <ReceiptListSkeleton />
            ) : error ? (
              <div className="text-center p-12 text-destructive">
                Failed to load receipts
              </div>
            ) : (
              <ReceiptList receipts={receipts} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
