"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { upload } from "@vercel/blob/client"

interface UploadState {
  status: "idle" | "uploading" | "scanning" | "success" | "error"
  message?: string
  receiptData?: any
}

const ENV_PATH_PREFIX =
  process.env.NODE_ENV === "production" ? "prod" : "dev"

export function ReceiptUpload({ clerkId, userEmail, householdId }: { clerkId: string; userEmail: string; householdId?: string }) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" })
  const [previewUrl, setPreviewUrl] = useState<string>()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadState({
        status: "error",
        message: "Please upload an image file",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState({
        status: "error",
        message: "File size must be less than 10MB",
      })
      return
    }

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    try {
      // Step 1: Upload to Vercel Blob
      setUploadState({
        status: "uploading",
        message: "Uploading image...",
      })

      const receiptId = `receipt-${Date.now()}`
      const blob = await upload(
        `${ENV_PATH_PREFIX}/receipts/${userEmail}/${receiptId}/${file.name}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/receipt/upload",
          clientPayload: JSON.stringify({
            receiptId,
            householdId,
          }),
        },
      )

      console.log("Upload completed:", blob.url)

      // Step 2: Process receipt with OpenAI
      setUploadState({
        status: "scanning",
        message: "Analyzing receipt...",
      })

      const processResponse = await fetch("/api/receipt/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: blob.url,
          householdId,
        }),
      })

      if (!processResponse.ok) {
        throw new Error("Failed to process receipt")
      }

      const receiptData = await processResponse.json()

      console.log("Receipt processed:", receiptData)

      setUploadState({
        status: "success",
        message: "Receipt uploaded and processed successfully!",
        receiptData,
      })

      // Reset after 5 seconds
      setTimeout(() => {
        setUploadState({ status: "idle" })
        setPreviewUrl(undefined)
      }, 5000)
    } catch (error) {
      console.error("Receipt upload error:", error)
      setUploadState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to process receipt",
      })
    }
  }

  const resetUpload = () => {
    setUploadState({ status: "idle" })
    setPreviewUrl(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
        <CardDescription>Take a photo or upload an image of your receipt for automatic scanning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center gap-4">
            {previewUrl ? (
              <div className="relative w-full max-w-sm">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Receipt preview"
                  className="w-full rounded-lg border-2 border-border object-contain"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            ) : (
              <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-12 transition-colors hover:border-primary hover:bg-muted">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <span className="mt-4 text-sm font-medium text-foreground">Click to upload or drag and drop</span>
                <span className="mt-1 text-xs text-muted-foreground">PNG, JPG or HEIC (max 10MB)</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadState.status !== "idle"}
                />
              </label>
            )}
          </div>

          {/* Status Messages */}
          {uploadState.status !== "idle" && (
            <div
              className={`flex items-center gap-3 rounded-lg p-4 ${
                uploadState.status === "success"
                  ? "bg-primary/10 text-primary"
                  : uploadState.status === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {uploadState.status === "uploading" || uploadState.status === "scanning" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : uploadState.status === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{uploadState.message}</span>
            </div>
          )}

          {/* Receipt Data Preview */}
          {uploadState.status === "success" && uploadState.receiptData && (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-3 text-sm font-semibold text-foreground">Receipt Details</h4>
              <div className="space-y-2 text-sm">
                {uploadState.receiptData.merchantName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merchant:</span>
                    <span className="font-medium text-foreground">
                      {uploadState.receiptData.merchantName}
                    </span>
                  </div>
                )}
                {uploadState.receiptData.totalAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium text-foreground">
                      {uploadState.receiptData.currency} {uploadState.receiptData.totalAmount}
                    </span>
                  </div>
                )}
                {uploadState.receiptData.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium text-foreground">
                      {uploadState.receiptData.location}
                    </span>
                  </div>
                )}
                {uploadState.receiptData.itemCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium text-foreground">
                      {uploadState.receiptData.itemCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Action Buttons */}
          {uploadState.status === "error" && (
            <Button onClick={resetUpload} variant="outline" className="w-full bg-transparent">
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
