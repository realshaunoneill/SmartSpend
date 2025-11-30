"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ReceiptList } from "@/components/receipt-list"
import { useUser } from "@clerk/nextjs"
import { useReceipts } from "@/lib/hooks/use-receipts"
import { ReceiptListSkeleton } from "@/components/receipt-list-skeleton"

export default function ReceiptsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { receipts, isLoading, error, refetch } = useReceipts()

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Receipts
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload and manage your receipts with automatic scanning
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ReceiptUpload
              clerkId={user.id}
              userEmail={user.emailAddresses[0]?.emailAddress || ""}
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
