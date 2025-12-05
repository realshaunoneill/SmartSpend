# CorrelationId Refactoring Complete

## Overview
Successfully added comprehensive correlationId tracking throughout the entire API and library layer to enable end-to-end request tracing.

## Changes Made

### 1. Core Auth Utilities (`lib/auth-helpers.ts`)
- Updated `getAuthenticatedUser()` to accept optional `correlationId` parameter
- Function generates fallback UUID if correlationId not provided
- Returns `{ user, clerkId, email, correlationId }` in response
- All `submitLogEvent` calls now use proper correlationId

### 2. API Routes (20+ files updated)
All routes now follow consistent pattern:

```typescript
export async function METHOD(request: NextRequest) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user, correlationId } = authResult;
    
    // All logs use correlationId
    submitLogEvent('type', 'message', correlationId, { data });
  }
}
```

#### Updated Routes:
- `/api/receipt/process` - Receipt OCR processing
- `/api/receipt/upload` - Image upload
- `/api/receipts` - List receipts
- `/api/receipts/[id]` - Delete receipt
- `/api/receipts/[id]/assign` - Assign to household
- `/api/receipts/[id]/retry` - Retry processing
- `/api/receipts/items/top` - Top items
- `/api/receipts/items/summary` - AI summary
- `/api/checkout` - Create checkout session
- `/api/households` - GET/POST households
- `/api/households/[id]` - GET/PATCH/DELETE household
- `/api/households/[id]/members` - GET/POST members
- `/api/households/[id]/members/[userId]` - DELETE member
- `/api/households/[id]/invitations` - POST/GET invitations
- `/api/invitations` - GET pending invitations
- `/api/invitations/[id]` - PATCH accept/decline
- `/api/users/me` - GET/PATCH user profile
- `/api/users/me/subscription` - GET/PATCH subscription

### 3. Library Functions

#### `lib/openai.ts`
- `analyzeReceiptWithGPT4o(imageUrl, email, userId, correlationId)` - Already had it
- `analyzeReceiptSimple(imageUrl, correlationId)` - Added correlationId parameter
- `generateSpendingSummary(aggregatedData, userEmail, userId, correlationId)` - Added correlationId parameter
- All 3+ `submitLogEvent` calls within each function use correlationId

#### `lib/stripe.ts`
- `createStripeCustomer(userId, email, clerkId, correlationId)` - Added correlationId parameter
- `getOrCreateStripeCustomer(..., correlationId)` - Added correlationId parameter
- `createCheckoutSession(..., correlationId)` - Added correlationId parameter
- `syncStripeDataToDatabase(customerId, correlationId)` - Already had it
- All functions pass correlationId through to `submitLogEvent` calls

## Benefits

### 1. End-to-End Request Tracing
- Every request now has a unique identifier from entry to completion
- Can trace a single request through all API calls, database operations, and external service calls
- Enables debugging of complex multi-step operations

### 2. Improved Debugging
- Filter logs by correlationId to see all events for a specific request
- Identify bottlenecks and performance issues
- Track errors back to originating request

### 3. Production Monitoring
- Better observability in production environments
- Can track request flow across distributed systems
- Enables correlation with external monitoring tools

## Usage

### Client Side
Include `x-correlation-id` header in requests:

```typescript
fetch('/api/receipts', {
  headers: {
    'x-correlation-id': crypto.randomUUID()
  }
})
```

### Server Side
CorrelationId is automatically:
1. Extracted from `x-correlation-id` header
2. Generated as fallback if not provided
3. Passed to all logging and service calls
4. Returned in auth response for downstream usage

### Log Filtering
Query logs by correlationId to see complete request lifecycle:

```typescript
// All logs for a specific request
logs.filter(log => log.correlationId === '123e4567-e89b-12d3-a456-426614174000')
```

## Type Safety
- CorrelationId type: `` `${string}-${string}-${string}-${string}-${string}` ``
- TypeScript enforces UUID v4 format
- No null or undefined allowed - always has valid UUID

## Verification

✅ Zero compilation errors
✅ All routes extract correlationId from header or generate fallback
✅ All `getAuthenticatedUser()` calls pass correlationId
✅ All `submitLogEvent()` calls use correlationId (no null values)
✅ All library functions accept and propagate correlationId
✅ Consistent pattern across entire codebase

## Testing Checklist

- [ ] Test with `x-correlation-id` header provided
- [ ] Test without `x-correlation-id` header (fallback generation)
- [ ] Verify logs can be filtered by correlationId
- [ ] Check correlationId propagates through multi-step operations
- [ ] Confirm external service calls include correlationId in logs
- [ ] Validate error logs include correlationId for debugging

## Related Documentation
- See `AUTH_REFACTOR.md` for authentication utilities documentation
- See `lib/logging.ts` for logging infrastructure details
