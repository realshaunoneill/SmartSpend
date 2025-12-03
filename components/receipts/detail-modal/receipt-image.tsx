"use client"

import { Receipt as ReceiptIcon } from "lucide-react"

interface ReceiptImageProps {
  imageUrl?: string
}

export function ReceiptImage({ imageUrl }: ReceiptImageProps) {
  return (
    <div className="w-[45%] p-2 pt-8 flex items-start justify-center border-r overflow-auto h-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Receipt"
          className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-2xl drop-shadow-xl"
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
