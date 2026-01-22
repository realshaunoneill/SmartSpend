import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, receipts, users } from '@/lib/db/schema';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ENV_PATH_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const MAX_UPLOAD_SIZE_MB = 15;

// Authenticate using API key
async function authenticateApiKey(apiKey: string, _correlationId: CorrelationId) {
  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.key, apiKey),
        eq(apiKeys.isRevoked, false),
      ),
    )
    .limit(1);

  if (!keyRecord) {
    return { error: 'Invalid API key', status: 401 };
  }

  // Check expiration
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return { error: 'API key expired', status: 401 };
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, keyRecord.userId))
    .limit(1);

  if (!user) {
    return { error: 'User not found', status: 404 };
  }

  if (user.isBlocked) {
    return { error: 'Account suspended', status: 403 };
  }

  // Check subscription
  const skipSubscriptionCheck = process.env.SKIP_SUBSCRIPTION_CHECK === 'true';
  if (!skipSubscriptionCheck && !user.subscribed) {
    return { error: 'Active subscription required', status: 403 };
  }

  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  return { user, keyRecord };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  // Enable CORS for extension
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  try {
    // Get API key from header
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401, headers },
      );
    }

    // Authenticate
    const authResult = await authenticateApiKey(apiKey, correlationId);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status, headers },
      );
    }

    const { user } = authResult;

    submitLogEvent('extension-upload', 'Extension upload started', correlationId, {
      userId: user.id,
      userEmail: user.email,
    });

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('imageUrl') as string | null;

    let finalImageUrl: string;

    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
          { status: 400, headers },
        );
      }

      if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large. Max size: ${MAX_UPLOAD_SIZE_MB}MB` },
          { status: 400, headers },
        );
      }

      // Upload to Vercel Blob
      const filename = `${ENV_PATH_PREFIX}/receipts/${user.id}/${Date.now()}-${file.name}`;
      const blob = await put(filename, file, {
        access: 'public',
        contentType: file.type,
      });

      finalImageUrl = blob.url;

      submitLogEvent('extension-upload', 'File uploaded to blob storage', correlationId, {
        userId: user.id,
        blobUrl: blob.url,
        fileSize: file.size,
      });
    } else if (imageUrl) {
      // Download image from URL and upload to blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch image from URL' },
          { status: 400, headers },
        );
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Image too large. Max size: ${MAX_UPLOAD_SIZE_MB}MB` },
          { status: 400, headers },
        );
      }

      const filename = `${ENV_PATH_PREFIX}/receipts/${user.id}/${Date.now()}-extension-upload.png`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType,
      });

      finalImageUrl = blob.url;

      submitLogEvent('extension-upload', 'URL image uploaded to blob storage', correlationId, {
        userId: user.id,
        sourceUrl: imageUrl,
        blobUrl: blob.url,
      });
    } else {
      return NextResponse.json(
        { error: 'No file or imageUrl provided' },
        { status: 400, headers },
      );
    }

    // Create receipt entry
    const [receipt] = await db
      .insert(receipts)
      .values({
        userId: user.id,
        householdId: user.defaultHouseholdId,
        imageUrl: finalImageUrl,
        processingStatus: 'pending',
      })
      .returning();

    submitLogEvent('extension-upload', 'Receipt created successfully', correlationId, {
      receiptId: receipt.id,
      userId: user.id,
      imageUrl: finalImageUrl,
    });

    // Trigger async processing
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.receiptwise.io'}/api/receipt/process`;
    fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ receiptId: receipt.id }),
    }).catch((err) => {
      submitLogEvent('extension-upload', `Background processing trigger failed: ${err.message}`, correlationId, {
        receiptId: receipt.id,
      }, true);
    });

    return NextResponse.json(
      {
        success: true,
        receiptId: receipt.id,
        imageUrl: finalImageUrl,
        processingStatus: 'pending',
      },
      { headers },
    );
  } catch (error) {
    submitLogEvent('extension-upload', `Extension upload error: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {
      error: error instanceof Error ? error.stack : undefined,
    }, true);

    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500, headers },
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
