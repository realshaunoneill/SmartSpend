"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { scanReceiptImage, saveReceipt } from "@/lib/receipt-scanner"

interface UploadState {
  status: "idle" | "uploading" | "scanning" | "success" | "error"
  message?: string
  receiptData?: any
}

export function ReceiptUpload({ userId, householdId }: { userId: string; householdId?: string }) {
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
      // Step 1: Upload to storage
      setUploadState({ status: "uploading", message: "Uploading image..." })
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Mock upload
      const imageUrl = "/placeholder.svg?key=receipt1" // Mock URL

      // Step 2: Scan with AI
      setUploadState({ status: "scanning", message: "Scanning receipt..." })
      const ocrData = await scanReceiptImage(imageUrl)

      // Step 3: Save to database
      const receipt = await saveReceipt({
        imageUrl,
        ocrData,
        userId,
        householdId,
      })

      setUploadState({
        status: "success",
        message: "Receipt uploaded successfully!",
        receiptData: receipt,
      })

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadState({ status: "idle" })
        setPreviewUrl(undefined)
      }, 3000)
    } catch (error) {
      setUploadState({
        status: "error",
        message: "Failed to process receipt",
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
              <h4 className="mb-3 text-sm font-semibold text-foreground">Scanned Data</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium text-foreground">{uploadState.receiptData.ocrData.merchant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium text-foreground">
                    ${uploadState.receiptData.ocrData.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium capitalize text-foreground">
                    {uploadState.receiptData.ocrData.category}
                  </span>
                </div>
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
