'use client';

import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, X, RefreshCw, Camera, Sparkles, FileImage, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { upload } from '@vercel/blob/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  receiptId?: string
  blobUrl?: string
}

const ENV_PATH_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

export function ReceiptBatchUpload({
  userEmail,
  householdId,
  onUploadComplete,
}: {
  userEmail: string
  householdId?: string
  onUploadComplete?: () => void
}) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Using a ref to track if we should auto-process
  const pendingFilesRef = useRef<UploadItem[]>([]);

  const addFiles = useCallback((files: File[]) => {
    const newItems: UploadItem[] = files
      .filter(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          return false;
        }
        // Validate file size (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          return false;
        }
        return true;
      })
      .map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0,
      }));

    if (newItems.length > 0) {
      pendingFilesRef.current = newItems;
      setUploadItems(prev => [...prev, ...newItems]);
    }
  }, []);

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const removeItem = useCallback((id: string) => {
    setUploadItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const retryItem = useCallback(async (id: string) => {
    const item = uploadItems.find(i => i.id === id);
    if (!item || !item.blobUrl) return;

    setUploadItems(prev =>
      prev.map(i => (i.id === id ? { ...i, status: 'processing' as const, progress: 50, error: undefined } : i)),
    );

    try {
      // If no receiptId, create the DB entry first
      let receiptId = item.receiptId;
      if (!receiptId) {
        const createResponse = await fetch('/api/receipt/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: item.blobUrl,
            householdId,
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create receipt entry');
        }

        const createData = await createResponse.json();
        receiptId = createData.receiptId;
      }

      const processResponse = await fetch('/api/receipt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process receipt');
      }

      setUploadItems(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'completed' as const, progress: 100 } : i)),
      );

      toast.success('Receipt processed successfully!');
      onUploadComplete?.();
    } catch (error) {
      setUploadItems(prev =>
        prev.map(i =>
          i.id === id
            ? {
                ...i,
                status: 'failed' as const,
                error: error instanceof Error ? error.message : 'Processing failed',
              }
            : i,
        ),
      );
      toast.error(error instanceof Error ? error.message : 'Failed to process receipt');
    }
  }, [uploadItems, householdId, onUploadComplete]);

  const processItem = useCallback(async (item: UploadItem) => {
    try {
      // Step 1: Upload to Vercel Blob
      setUploadItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, status: 'uploading' as const, progress: 25 } : i)),
      );

      const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const blob = await upload(
        `${ENV_PATH_PREFIX}/receipts/${userEmail}/${receiptId}/${item.file.name}`,
        item.file,
        {
          access: 'public',
          handleUploadUrl: '/api/receipt/upload',
          clientPayload: JSON.stringify({ receiptId, householdId }),
        },
      );

      // Step 2: Create receipt entry in database
      const createResponse = await fetch('/api/receipt/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: blob.url,
          householdId,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create receipt entry');
      }

      const { receiptId: dbReceiptId } = await createResponse.json();

      // Step 3: Trigger async processing (fire and forget)
      setUploadItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'processing' as const, progress: 50, blobUrl: blob.url, receiptId: dbReceiptId }
            : i,
        ),
      );

      // Start processing but don't wait for it
      fetch('/api/receipt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: dbReceiptId,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Failed to process receipt');
          }

          setUploadItems(prev =>
            prev.map(i => (i.id === item.id ? { ...i, status: 'completed' as const, progress: 100 } : i)),
          );

          toast.success('Receipt processed successfully!');

          // Notify parent to refresh
          onUploadComplete?.();
        })
        .catch((error) => {
          setUploadItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'failed' as const,
                    error: error instanceof Error ? error.message : 'Processing failed',
                  }
                : i,
            ),
          );
          toast.error(error instanceof Error ? error.message : 'Failed to process receipt');
        });

      // Mark as uploaded (processing happens async)
      setUploadItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, progress: 75 } : i)),
      );
    } catch (error) {
      setUploadItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'failed' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : i,
        ),
      );
    }
  }, [userEmail, householdId, onUploadComplete]);

  const processItems = useCallback(async (items: UploadItem[]) => {
    // Process all items in parallel (async)
    items.forEach(item => {
      if (item.status === 'pending') {
        processItem(item);
      }
    });
  }, [processItem]);

  // Auto-process newly added files
  useEffect(() => {
    if (pendingFilesRef.current.length > 0) {
      const itemsToProcess = pendingFilesRef.current;
      pendingFilesRef.current = [];
      processItems(itemsToProcess);
    }
  }, [uploadItems, processItems]);

  const clearCompleted = useCallback(() => {
    setUploadItems(prev => {
      const completed = prev.filter(i => i.status === 'completed');
      completed.forEach(item => URL.revokeObjectURL(item.previewUrl));
      return prev.filter(i => i.status !== 'completed');
    });
  }, []);

  const completedCount = uploadItems.filter(i => i.status === 'completed').length;
  const failedCount = uploadItems.filter(i => i.status === 'failed').length;
  const processingCount = uploadItems.length - completedCount - failedCount;

  // Show celebration when all uploads complete
  const allCompleted = uploadItems.length > 0 && completedCount === uploadItems.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Receipt Upload
            </CardTitle>
            <CardDescription className="mt-1">
              Drag, drop, or snap a photo — we&apos;ll handle the rest
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTips(!showTips)}
            className="text-muted-foreground"
          >
            <Info className="h-4 w-4 mr-1" />
            Tips
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tips Section */}
        {showTips && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm space-y-2">
            <p className="font-medium text-primary">📸 Tips for best results:</p>
            <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
              <li>Make sure the receipt is well-lit and flat</li>
              <li>Include all text, especially the total and date</li>
              <li>Crop out unnecessary background</li>
              <li>Upload multiple receipts at once to save time</li>
            </ul>
          </div>
        )}

        {/* Upload Area - Drag & Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
              : 'border-muted-foreground/25 bg-gradient-to-b from-muted/30 to-muted/50 hover:border-primary/50 hover:bg-muted/80',
          )}
        >
          {/* Animated background elements when dragging */}
          {isDragging && (
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse delay-150" />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center">
            {isDragging ? (
              <>
                <div className="rounded-full bg-primary/20 p-4 mb-3 animate-bounce">
                  <FileImage className="h-10 w-10 text-primary" />
                </div>
                <span className="text-lg font-semibold text-primary">Drop your receipts here!</span>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <span className="text-base font-medium text-foreground">
                  Drag & drop receipts here
                </span>
                <span className="mt-1 text-sm text-muted-foreground">
                  or choose an option below
                </span>
              </>
            )}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFilesChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileImage className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 md:hidden"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Supports PNG, JPG, WEBP • Max 15MB per file
        </p>

        {/* Upload Queue */}
        {uploadItems.length > 0 && (
          <div className="space-y-3 pt-2">
            {/* Status Bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold">{uploadItems.length} receipt{uploadItems.length !== 1 ? 's' : ''}</span>
                {completedCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {completedCount} done
                  </span>
                )}
                {processingCount > 0 && (
                  <span className="flex items-center gap-1 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingCount} processing
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" />
                    {failedCount} failed
                  </span>
                )}
              </div>
              {completedCount > 0 && (
                <Button onClick={clearCompleted} variant="ghost" size="sm" className="text-muted-foreground">
                  Clear Done
                </Button>
              )}
            </div>

            {/* Success Celebration */}
            {allCompleted && (
              <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-700 dark:text-green-400">
                <div className="rounded-full bg-green-500/20 p-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">All receipts processed! 🎉</p>
                  <p className="text-sm opacity-80">Your spending data is ready to view</p>
                </div>
              </div>
            )}

            {/* Upload Items List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {uploadItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-all duration-200',
                    item.status === 'failed' && 'bg-destructive/5 border-destructive/20',
                    item.status === 'completed' && 'bg-green-500/5 border-green-500/20',
                    item.status === 'uploading' || item.status === 'processing' ? 'bg-primary/5 border-primary/20' : 'bg-card',
                  )}
                >
                  {/* Preview Image */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={item.previewUrl}
                      alt="Receipt preview"
                      className={cn(
                        'h-full w-full object-cover transition-all',
                        item.status === 'failed' && 'opacity-50 grayscale',
                      )}
                    />
                    {item.status === 'completed' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/40">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/40">
                        <XCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.file.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                      {item.status === 'processing' && (
                        <span className="text-primary">• AI scanning...</span>
                      )}
                      {item.status === 'uploading' && (
                        <span className="text-primary">• Uploading...</span>
                      )}
                    </div>
                    {item.error && (
                      <div className="text-xs text-destructive mt-1">{item.error}</div>
                    )}
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <Progress value={item.progress} className="mt-2 h-1.5" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'failed' && (
                      <Button
                        onClick={() => retryItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-primary hover:text-primary"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    {item.status !== 'uploading' && item.status !== 'processing' && (
                      <Button
                        onClick={() => removeItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
