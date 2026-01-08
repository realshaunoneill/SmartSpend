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

// GET - Retrieve existing API key or create new one
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    // Look for existing active API key
    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, user.id),
          eq(apiKeys.isRevoked, false)
        )
      )
      .limit(1);

    if (existingKey) {
      return NextResponse.json({
        id: existingKey.id,
        key: existingKey.key,
        name: existingKey.name,
        createdAt: existingKey.createdAt,
        lastUsedAt: existingKey.lastUsedAt,
      });
    }

    // Create new API key
    const newKey = generateApiKey();
    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        key: newKey,
        name: 'Chrome Extension',
      })
      .returning();

    submitLogEvent('api-key', 'Created new API key', correlationId, { userId: user.id });

    return NextResponse.json({
      id: created.id,
      key: created.key,
      name: created.name,
      createdAt: created.createdAt,
      lastUsedAt: created.lastUsedAt,
    });
  } catch (error) {
    submitLogEvent('api-key', `Error managing API key: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to manage API key' },
      { status: 500 }
    );
  }
}

// POST - Regenerate API key
export async function POST(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Check subscription
    const subCheck = await requireSubscription(user);
    if (subCheck) return subCheck;

    // Revoke all existing keys
    await db
      .update(apiKeys)
      .set({ isRevoked: true })
      .where(eq(apiKeys.userId, user.id));

    // Create new API key
    const newKey = generateApiKey();
    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        key: newKey,
        name: 'Chrome Extension',
      })
      .returning();

    submitLogEvent('api-key', 'Regenerated API key', correlationId, { userId: user.id });

    return NextResponse.json({
      id: created.id,
      key: created.key,
      name: created.name,
      createdAt: created.createdAt,
      lastUsedAt: created.lastUsedAt,
    });
  } catch (error) {
    submitLogEvent('api-key', `Error regenerating API key: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke API key
export async function DELETE(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Revoke all existing keys
    await db
      .update(apiKeys)
      .set({ isRevoked: true })
      .where(eq(apiKeys.userId, user.id));

    submitLogEvent('api-key', 'Revoked API key', correlationId, { userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    submitLogEvent('api-key', `Error revoking API key: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
