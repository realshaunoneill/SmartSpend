import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, filterReceiptsForSubscription } from '@/lib/auth-helpers';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';
import { getReceipts } from '@/lib/receipt-scanner';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');
    const personalOnly = searchParams.get('personalOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Search and filter parameters
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const merchant = searchParams.get('merchant') || undefined;
    const minAmount = searchParams.get('minAmount') || undefined;
    const maxAmount = searchParams.get('maxAmount') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Use the helper function to get receipts
    const result = await getReceipts({
      userId: user.id,
      householdId,
      personalOnly,
      page,
      limit,
      search,
      category,
      merchant,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    // Filter receipts based on subscription status
    const filteredReceipts = filterReceiptsForSubscription(result.receipts, user.subscribed);

    return NextResponse.json({
      ...result,
      receipts: filteredReceipts,
    });
  } catch (error) {
    submitLogEvent('receipt', `Error fetching receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 },
    );
  }
}
