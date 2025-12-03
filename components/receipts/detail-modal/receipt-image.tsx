"use client"

import { Receipt as ReceiptIcon } from "lucide-react"

interface ReceiptImageProps {
  imageUrl?: string
}

export function ReceiptImage({ imageUrl }: ReceiptImageProps) {
  return (
    <div className="w-full h-full p-6 flex items-center justify-center overflow-auto bg-linear-to-br from-muted/20 to-muted/40">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Receipt"
          className="max-w-full max-h-[85vh] h-auto object-contain rounded-xl shadow-lg border border-border/50 bg-white dark:bg-gray-900"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
          <ReceiptIcon className="h-24 w-24 mb-4 opacity-20" />
          <p className="text-sm">No image available</p>
        </div>
      )}
    </div>
  )
}
