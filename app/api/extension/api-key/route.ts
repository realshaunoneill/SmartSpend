import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, requireSubscription } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';

export const runtime = 'nodejs';

// Generate a secure API key
function generateApiKey(): string {
  return `rw_${randomBytes(32).toString('hex')}`;
}

// Mask API key for display (show only last 8 characters)
function maskApiKey(key: string): string {
  if (key.length <= 8) return key;
  return `${'•'.repeat(key.length - 8)}${key.slice(-8)}`;
}

// GET - List all API keys for the user (masked for security)
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    // Get all active API keys for the user
    const keys = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, user.id),
          eq(apiKeys.isRevoked, false),
        ),
      )
      .orderBy(apiKeys.createdAt);

    // Return masked keys for security
    const maskedKeys = keys.map(k => ({
      id: k.id,
      name: k.name,
      maskedKey: maskApiKey(k.key),
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    submitLogEvent('api-key', `Error listing API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 },
    );
  }
}

// POST - Create a new API key
export async function POST(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    // Parse request body for optional key name
    const body = await req.json().catch(() => ({}));
    const keyName = body.name || 'Chrome Extension';

    // Create new API key
    const newKey = generateApiKey();
    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        key: newKey,
        name: keyName,
      })
      .returning();

    submitLogEvent('api-key', 'Created new API key', correlationId, { userId: user.id, keyName });

    // Return full key only on creation (user needs to copy it)
    return NextResponse.json({
      id: created.id,
      key: created.key, // Full key shown only once
      name: created.name,
      createdAt: created.createdAt,
      lastUsedAt: created.lastUsedAt,
    });
  } catch (error) {
    submitLogEvent('api-key', `Error creating API key: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 },
    );
  }
}

// DELETE - Revoke specific API key by ID
export async function DELETE(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Get key ID from request body
    const body = await req.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 },
      );
    }

    // Revoke the specific key (verify it belongs to the user)
    const result = await db
      .update(apiKeys)
      .set({ isRevoked: true })
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.userId, user.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 },
      );
    }

    submitLogEvent('api-key', 'Revoked API key', correlationId, { userId: user.id, keyId });

    return NextResponse.json({ success: true });
  } catch (error) {
    submitLogEvent('api-key', `Error revoking API key: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 },
    );
  }
}
