# API Routes Authentication Refactor

## Overview
Refactored all API routes to use centralized authentication utilities, improving code consistency, maintainability, and reducing duplication across the codebase.

## New Utilities Created

### Location: `lib/auth-helpers.ts`

#### 1. `getAuthenticatedUser()`
**Purpose**: Get or create authenticated user from database in one call.

**Returns**: 
- `{ user, clerkId }` on success
- `NextResponse` error object on failure (401 for unauthorized, 400 for missing email, 500 for database errors)

**Usage**:
```typescript
const authResult = await getAuthenticatedUser();
if (authResult instanceof NextResponse) return authResult;
const { user, clerkId } = authResult;
```

**What it replaces**:
```typescript
const { userId: clerkId } = await auth();
if (!clerkId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const email = await getClerkUserEmail(clerkId);
if (!email) {
  return NextResponse.json({ error: "User email not found" }, { status: 400 });
}
const user = await UserService.getOrCreateUser(clerkId, email);
```

**Benefits**:
- Reduces ~15 lines of boilerplate to 2 lines
- Consistent error handling across all routes
- Automatic user creation if doesn't exist
- Type-safe return values

#### 2. `requireSubscription(userOrResult)`
**Purpose**: Check if user has an active subscription (for premium endpoints).

**Parameters**:
- `userOrResult`: Either a user object or the result from `getAuthenticatedUser()`

**Returns**:
- `null` if user is subscribed (or `SKIP_SUBSCRIPTION_CHECK=true`)
- `NextResponse` error (403) if subscription required

**Usage**:
```typescript
const authResult = await getAuthenticatedUser();
if (authResult instanceof NextResponse) return authResult;
const { user } = authResult;

// Check subscription for premium features
const subCheck = await requireSubscription(user);
if (subCheck) return subCheck;
```

**Environment Variable**:
- `SKIP_SUBSCRIPTION_CHECK=true` - Bypass subscription checks (useful for development)

## Routes Updated

### Premium Endpoints (Require Subscription)

These routes now check for active subscription:

1. **Receipt Processing**
   - `POST /api/receipt/process` - Process uploaded receipts with AI
   - `POST /api/receipt/upload` - Upload receipt images

2. **Household Management**
   - `POST /api/households` - Create new household

3. **AI Features**
   - All item analysis endpoints (future)
   - Spending insights endpoints (future)

### Standard Endpoints (Auth Only)

These routes only require authentication:

1. **User Management**
   - `GET /api/users/me` - Get current user
   - `PATCH /api/users/me` - Update user profile
   - `GET /api/users/me/subscription` - Get subscription status
   - `PATCH /api/users/default-household` - Update default household

2. **Receipt Management**
   - `GET /api/receipts` - List receipts
   - `GET /api/receipts/[id]` - Get receipt details
   - `DELETE /api/receipts/[id]` - Delete receipt
   - `PATCH /api/receipts/[id]/assign` - Assign receipt to household
   - `POST /api/receipts/[id]/retry` - Retry failed receipt processing
   - `GET /api/receipts/items/top` - Get top items
   - `GET /api/receipts/items/summary` - Get items summary

3. **Household Management**
   - `GET /api/households` - List user's households
   - `GET /api/households/[id]` - Get household details
   - `PATCH /api/households/[id]` - Update household
   - `DELETE /api/households/[id]` - Delete household
   - `GET /api/households/[id]/members` - List members
   - `POST /api/households/[id]/members` - Add member
   - `DELETE /api/households/[id]/members/[userId]` - Remove member
   - `POST /api/households/[id]/invitations` - Send invitation
   - `GET /api/households/[id]/invitations` - List invitations

4. **Invitations**
   - `GET /api/invitations` - Get pending invitations
   - `PATCH /api/invitations/[id]` - Accept/reject invitation

5. **Checkout**
   - `POST /api/checkout` - Create Stripe checkout session

## Files Modified

### Core Utilities
- ✅ `lib/auth-helpers.ts` - Added `getAuthenticatedUser()` and `requireSubscription()`

### API Routes (18 files updated)
- ✅ `app/api/checkout/route.ts`
- ✅ `app/api/households/route.ts`
- ✅ `app/api/households/[id]/route.ts`
- ✅ `app/api/households/[id]/invitations/route.ts`
- ✅ `app/api/households/[id]/members/route.ts`
- ✅ `app/api/households/[id]/members/[userId]/route.ts`
- ✅ `app/api/invitations/route.ts`
- ✅ `app/api/invitations/[id]/route.ts`
- ✅ `app/api/receipt/process/route.ts`
- ✅ `app/api/receipt/upload/route.ts`
- ✅ `app/api/receipts/route.ts`
- ✅ `app/api/receipts/[id]/route.ts`
- ✅ `app/api/receipts/[id]/assign/route.ts`
- ✅ `app/api/receipts/[id]/retry/route.ts`
- ✅ `app/api/receipts/items/top/route.ts`
- ✅ `app/api/receipts/items/summary/route.ts`
- ✅ `app/api/users/me/route.ts`
- ✅ `app/api/users/me/subscription/route.ts`
- ✅ `app/api/users/default-household/route.ts`

## Code Reduction

**Before**: ~15 lines per route
```typescript
const { userId: clerkId } = await auth();
if (!clerkId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const email = await getClerkUserEmail(clerkId);
if (!email) {
  return NextResponse.json({ error: "User email not found" }, { status: 400 });
}
const user = await UserService.getOrCreateUser(clerkId, email);

// For premium endpoints, also need:
const skipSubscriptionCheck = process.env.SKIP_SUBSCRIPTION_CHECK === "true";
if (!skipSubscriptionCheck && !user.subscribed) {
  return NextResponse.json(
    { error: "Subscription required" },
    { status: 403 }
  );
}
```

**After**: 2-4 lines per route
```typescript
const authResult = await getAuthenticatedUser();
if (authResult instanceof NextResponse) return authResult;
const { user } = authResult;

// For premium endpoints:
const subCheck = await requireSubscription(user);
if (subCheck) return subCheck;
```

**Statistics**:
- **Lines Removed**: ~270 lines of duplicated code
- **Lines Added**: ~40 lines (utilities + usage)
- **Net Reduction**: ~230 lines
- **Routes Updated**: 18 routes, 25+ individual methods

## Benefits

1. **Consistency**: All routes use the same auth pattern
2. **Maintainability**: Auth logic changes only need to be made in one place
3. **Type Safety**: Utilities provide proper TypeScript types
4. **Error Handling**: Consistent error responses across all endpoints
5. **Security**: Centralized subscription checks for premium features
6. **Readability**: Less boilerplate, clearer business logic
7. **Testing**: Easier to mock and test authentication

## Testing Checklist

- [ ] Test authentication with valid Clerk token
- [ ] Test authentication without token (should return 401)
- [ ] Test authentication with invalid token
- [ ] Test user creation on first login
- [ ] Test subscription checks on premium endpoints
- [ ] Test `SKIP_SUBSCRIPTION_CHECK=true` bypass in development
- [ ] Test all receipt upload/processing flows
- [ ] Test household creation (requires subscription)
- [ ] Test regular endpoints work without subscription
- [ ] Verify error messages are user-friendly

## Future Enhancements

Potential improvements:
- Add role-based authorization utility (`requireRole()`)
- Add rate limiting utility (`requireRateLimit()`)
- Add request context utility (tracking, correlation IDs)
- Add permission checking utility (`requirePermission()`)
- Cache user lookups for better performance
- Add telemetry/metrics to auth utilities
