"use client"

import { Receipt as ReceiptIcon, ZoomIn, ZoomOut, Maximize2, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReceiptImageProps {
  imageUrl?: string
}

export function ReceiptImage({ imageUrl }: ReceiptImageProps) {
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 1)
    setZoom(newZoom)
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true)
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsPanning(true)
      setStartPos({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && zoom > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y
      })
    }
  }

  const handleTouchEnd = () => {
    setIsPanning(false)
  }

  return (
    <>
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-linear-to-br from-muted/20 to-muted/40">
        {imageUrl ? (
          <>
            {/* Image container */}
            <div
              className="w-full h-full flex items-center justify-center p-4 sm:p-6"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
            >
              <img
                src={imageUrl}
                alt="Receipt"
                className="max-w-full max-h-full h-auto object-contain rounded-lg shadow-2xl border border-border/50 bg-white dark:bg-gray-900 transition-transform"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transformOrigin: 'center center'
                }}
                draggable={false}
              />
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <button
                onClick={handleResetZoom}
                className="px-3 py-1 text-xs font-medium hover:bg-muted rounded transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {zoom > 1 && (
              <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-3 py-1.5 text-xs text-muted-foreground">
                {isPanning ? 'Dragging...' : 'Click and drag to pan'}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
            <ReceiptIcon className="h-24 w-24 mb-4 opacity-20" />
            <p className="text-sm">No image available</p>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && imageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background transition-colors z-10"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={imageUrl}
            alt="Receipt - Fullscreen"
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
