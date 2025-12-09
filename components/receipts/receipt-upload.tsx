'use client';

import type React from 'react';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { upload } from '@vercel/blob/client';

interface UploadState {
  status: 'idle' | 'uploading' | 'scanning' | 'success' | 'error'
  message?: string
  receiptData?: any
}

const ENV_PATH_PREFIX =
  process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

export function ReceiptUpload({
  clerkId: _clerkId,
  userEmail,
  householdId,
  onUploadComplete,
}: {
  clerkId: string;
  userEmail: string;
  householdId?: string;
  onUploadComplete?: () => void;
}) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [previewUrl, setPreviewUrl] = useState<string>();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadState({
        status: 'error',
        message: 'Please upload an image file',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState({
        status: 'error',
        message: 'File size must be less than 10MB',
      });
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      // Step 1: Upload to Vercel Blob
      setUploadState({
        status: 'uploading',
        message: 'Uploading image...',
      });

      const receiptId = `receipt-${Date.now()}`;
      const blob = await upload(
        `${ENV_PATH_PREFIX}/receipts/${userEmail}/${receiptId}/${file.name}`,
        file,
        {
          access: 'public',
          handleUploadUrl: '/api/receipt/upload',
          clientPayload: JSON.stringify({
            receiptId,
            householdId,
          }),
        },
      );

      console.log('Upload completed:', blob.url);

      // Step 2: Process receipt with OpenAI
      setUploadState({
        status: 'scanning',
        message: 'Analyzing receipt...',
      });

      const processResponse = await fetch('/api/receipt/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: blob.url,
          householdId,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process receipt');
      }

      const receiptData = await processResponse.json();

      console.log('Receipt processed:', receiptData);

      setUploadState({
        status: 'success',
        message: 'Receipt uploaded and processed successfully!',
        receiptData,
      });

      // Call the callback to refresh the list
      if (onUploadComplete) {
        onUploadComplete();
      }

      // Reset after 5 seconds
      setTimeout(() => {
        setUploadState({ status: 'idle' });
        setPreviewUrl(undefined);
      }, 5000);
    } catch (error) {
      console.error('Receipt upload error:', error);
      setUploadState({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to process receipt',
      });
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle' });
    setPreviewUrl(undefined);
  };

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
                  src={previewUrl || '/placeholder.svg'}
                  alt="Receipt preview"
                  className="w-full rounded-lg border-2 border-border object-contain"
                  style={{ maxHeight: '300px' }}
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
                  disabled={uploadState.status !== 'idle'}
                />
              </label>
            )}
          </div>

          {/* Status Messages */}
          {uploadState.status !== 'idle' && (
            <div
              className={`flex items-center gap-3 rounded-lg p-4 ${
                uploadState.status === 'success'
                  ? 'bg-primary/10 text-primary'
                  : uploadState.status === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {uploadState.status === 'uploading' || uploadState.status === 'scanning' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : uploadState.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{uploadState.message}</span>
            </div>
          )}

          {/* Receipt Data Preview */}
          {uploadState.status === 'success' && uploadState.receiptData && (
            <div className="space-y-4">
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
                  {uploadState.receiptData.location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                        {uploadState.receiptData.location}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.transactionDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium text-foreground">
                        {uploadState.receiptData.transactionDate}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.subtotal && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium text-foreground">
                        {uploadState.receiptData.currency} {uploadState.receiptData.subtotal}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.tax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium text-foreground">
                        {uploadState.receiptData.currency} {uploadState.receiptData.tax}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.serviceCharge && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Charge:</span>
                      <span className="font-medium text-foreground">
                        {uploadState.receiptData.currency} {uploadState.receiptData.serviceCharge}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.totalAmount && (
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground font-semibold">Total:</span>
                      <span className="font-bold text-foreground">
                        {uploadState.receiptData.currency} {uploadState.receiptData.totalAmount}
                      </span>
                    </div>
                  )}
                  {uploadState.receiptData.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium text-foreground capitalize">
                        {uploadState.receiptData.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              {uploadState.receiptData.items && uploadState.receiptData.items.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Items ({uploadState.receiptData.items.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadState.receiptData.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm border-b pb-2 last:border-0">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item.name}</div>
                          {item.quantity && (
                            <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                          )}
                        </div>
                        {item.price && (
                          <div className="font-medium text-foreground">
                            {uploadState.receiptData.currency} {item.price}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Action Buttons */}
          {uploadState.status === 'error' && (
            <Button onClick={resetUpload} variant="outline" className="w-full bg-transparent">
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
