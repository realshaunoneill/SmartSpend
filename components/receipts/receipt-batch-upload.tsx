'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { upload } from '@vercel/blob/client';

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
  clerkId,
  userEmail,
  householdId,
  onUploadComplete,
}: {
  clerkId: string
  userEmail: string
  householdId?: string
  onUploadComplete?: () => void
}) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

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

    setUploadItems(prev => [...prev, ...newItems]);

    // Auto-start processing for new items
    if (newItems.length > 0) {
      processItems(newItems);
    }
  }, []);

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
      const processResponse = await fetch('/api/receipt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: item.blobUrl,
          householdId,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process receipt');
      }

      setUploadItems(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'completed' as const, progress: 100 } : i)),
      );

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

      // Step 2: Trigger async processing (fire and forget)
      setUploadItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'processing' as const, progress: 50, blobUrl: blob.url, receiptId }
            : i,
        ),
      );

      // Start processing but don't wait for it
      fetch('/api/receipt/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: blob.url,
          householdId,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Failed to process receipt');
          }

          setUploadItems(prev =>
            prev.map(i => (i.id === item.id ? { ...i, status: 'completed' as const, progress: 100 } : i)),
          );

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

  const clearCompleted = useCallback(() => {
    setUploadItems(prev => {
      const completed = prev.filter(i => i.status === 'completed');
      completed.forEach(item => URL.revokeObjectURL(item.previewUrl));
      return prev.filter(i => i.status !== 'completed');
    });
  }, []);

  const completedCount = uploadItems.filter(i => i.status === 'completed').length;
  const failedCount = uploadItems.filter(i => i.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Upload Receipts</CardTitle>
        <CardDescription>Upload multiple receipts at once for automatic processing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-8 transition-colors hover:border-primary hover:bg-muted">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="mt-3 text-sm font-medium text-foreground">
              Click to select multiple receipts
            </span>
            <span className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP (max 15MB each)</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
            />
          </label>

          {/* Upload Queue */}
          {uploadItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {uploadItems.length} total
                  {completedCount > 0 && <span className="text-green-600 ml-2">• {completedCount} completed</span>}
                  {failedCount > 0 && <span className="text-destructive ml-2">• {failedCount} failed</span>}
                  {(uploadItems.length - completedCount - failedCount) > 0 && (
                    <span className="text-muted-foreground ml-2">
                      • {uploadItems.length - completedCount - failedCount} processing
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {completedCount > 0 && (
                    <Button onClick={clearCompleted} variant="ghost" size="sm">
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uploadItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      item.status === 'failed' ? 'bg-destructive/5 border-destructive/20' : 'bg-card'
                    }`}
                  >
                    {/* Preview Image */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                      <img
                        src={item.previewUrl}
                        alt="Receipt preview"
                        className={`h-full w-full object-cover ${item.status === 'failed' ? 'blur-sm' : ''}`}
                      />
                      {item.status === 'failed' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                          <XCircle className="h-6 w-6 text-destructive" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {item.error && (
                        <div className="text-xs text-destructive mt-1">{item.error}</div>
                      )}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <Progress value={item.progress} className="mt-2 h-1" />
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="shrink-0">
                      {item.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/25" />
                      )}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {item.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {item.status === 'failed' && (
                        <Button
                          onClick={() => retryItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Remove Button */}
                    {item.status !== 'uploading' && item.status !== 'processing' && (
                      <Button
                        onClick={() => removeItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
