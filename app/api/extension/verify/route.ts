import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };

  try {
    const apiKey = req.headers.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key required' },
        { status: 401, headers }
      );
    }

    // Look up API key
    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, apiKey),
          eq(apiKeys.isRevoked, false)
        )
      )
      .limit(1);

    if (!keyRecord) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key' },
        { status: 401, headers }
      );
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'API key expired' },
        { status: 401, headers }
      );
    }

    // Get user info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, keyRecord.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'User not found' },
        { status: 404, headers }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { valid: false, error: 'Account suspended' },
        { status: 403, headers }
      );
    }

    // Check subscription
    const skipSubscriptionCheck = process.env.SKIP_SUBSCRIPTION_CHECK === 'true';
    if (!skipSubscriptionCheck && !user.subscribed) {
      return NextResponse.json(
        { valid: false, error: 'Active subscription required' },
        { status: 403, headers }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        user: {
          email: user.email,
          subscribed: user.subscribed,
        },
      },
      { headers }
    );
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500, headers }
    );
  }
}

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
