# Default Household Feature

## Overview
This feature allows users to set a default household for automatic receipt uploads. When a default household is configured, all new receipts will automatically be assigned to that household unless explicitly assigned to a different household during upload.

## Implementation

### Database Changes

**Schema Update** (`lib/db/schema.ts`):
- Added `defaultHouseholdId` field to the `users` table
- Type: UUID, nullable
- References: `households.id` with `ON DELETE SET NULL`
- Location: Added between `stripeCustomerId` and `createdAt` fields

**Migration**:
- Generated via Drizzle Kit: `lib/db/migrations/0005_yielding_master_mold.sql`
- Command used: `npx drizzle-kit generate`
- **Status**: Migration file created, needs to be pushed to database with `npx drizzle-kit push` or applied in production

### API Changes

**New Endpoint** (`app/api/users/default-household/route.ts`):
- Method: `PATCH`
- Purpose: Update user's default household
- Request Body: `{ householdId: string | null }`
- Validation: Ensures user has access to the specified household
- Response: `{ success: true, defaultHouseholdId: string | null }`

**Receipt Processing Update** (`app/api/receipt/process/route.ts`):
- Modified to check for default household if no `householdId` provided in request
- Logic: If `!householdId && user.defaultHouseholdId`, uses `user.defaultHouseholdId`
- Includes logging for tracking when default household is applied

### UI Changes

**Settings Page** (`app/settings/page.tsx`):
- Added new "Default Household" card between "Account Information" and "Danger Zone"
- Features:
  - Dropdown to select from user's households or "None"
  - Save button that enables only when selection changes
  - Description explaining the feature
  - Loading state while fetching households
  - Disabled state when no households available
- State Management:
  - Uses React Query to fetch households
  - Mutation for updating default household
  - Optimistic updates with cache invalidation
  - Toast notifications for success/error

## User Flow

1. **Setup**:
   - User navigates to Settings page
   - Sees "Default Household" section
   - Selects a household from dropdown (or "None")
   - Clicks "Save Default Household"
   - Toast confirmation appears

2. **Receipt Upload**:
   - User uploads a receipt without specifying household
   - System automatically assigns receipt to default household
   - Receipt appears in household's receipt list

3. **Override**:
   - User can still manually assign receipts to different households during upload
   - Default only applies when no household explicitly chosen

## Technical Details

### TypeScript Types
```typescript
// In schema.ts
defaultHouseholdId: uuid('default_household_id')
  .references(() => households.id, { onDelete: 'set null' })
```

### API Request Example
```typescript
// Update default household
await fetch('/api/users/default-household', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ householdId: 'uuid-here' })
})

// Remove default household
await fetch('/api/users/default-household', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ householdId: null })
})
```

### Security Considerations
- Endpoint validates user authentication via Clerk
- Verifies user membership in selected household
- Uses foreign key constraint with `ON DELETE SET NULL` for data integrity
- If household is deleted, default is automatically cleared

## Deployment Checklist

Before deploying to production:

1. **Database Migration**:
   - [ ] Run `npx drizzle-kit push` in production environment OR
   - [ ] Apply migration manually via database admin panel
   - [ ] Verify column exists: `SELECT default_household_id FROM users LIMIT 1;`

2. **Testing**:
   - [ ] Test setting default household in settings
   - [ ] Test uploading receipt without household selection
   - [ ] Test uploading receipt with explicit household selection (should override default)
   - [ ] Test removing default household
   - [ ] Test with user who has no households
   - [ ] Test household deletion (default should be set to null)

3. **Monitoring**:
   - [ ] Check logs for "Using default household for receipt" events
   - [ ] Monitor API errors from new endpoint
   - [ ] Verify React Query cache invalidation working

## Future Enhancements

Potential improvements for future iterations:
- Allow setting default household per device/client
- Add default household indicator in household list
- Show which receipts used default vs manual assignment
- Batch update default household for existing receipts
- Analytics on default household usage
