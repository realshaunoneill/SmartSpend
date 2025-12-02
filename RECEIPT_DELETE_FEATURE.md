# Receipt Soft Delete Feature

## Overview
Implemented soft delete functionality for receipts, allowing users to delete their own receipts. Deleted receipts are marked with a `deletedAt` timestamp rather than being permanently removed from the database.

## Changes Made

### 1. Database Schema (`lib/db/schema.ts`)
- Added `deletedAt: timestamp('deleted_at')` field to the receipts table
- This allows for soft deletion - receipts are marked as deleted but not removed

### 2. Database Migration
- Generated migration file: `lib/db/migrations/0004_bright_stick.sql`
- Applied migration using `scripts/add-deleted-at.ts`
- Column successfully added to production database

### 3. Receipt Service Helper Functions (`lib/receipt-scanner.ts`)
**New helper functions for receipt management:**

#### `getReceipts(options: GetReceiptsOptions)`
Centralized function for fetching receipts with pagination and filtering.

**Options:**
- `userId`: User ID (required)
- `householdId`: Filter by household (optional)
- `personalOnly`: Only personal receipts (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `includeDeleted`: Include soft-deleted receipts (default: false)

**Returns:** `PaginatedReceipts` with receipts array and pagination metadata

#### `getReceiptById(receiptId: string, includeDeleted?: boolean)`
Get a single receipt by ID with optional deleted filter.

#### `deleteReceipt(receiptId: string, userId: string)`
Soft delete a receipt with ownership verification.

**Returns:** `boolean` - true if deleted, false if not found or unauthorized

### 4. Delete API Endpoint (`app/api/receipts/[id]/route.ts`)
**Endpoint:** `DELETE /api/receipts/:id`

**Features:**
- Verifies user authentication
- Uses `getReceiptById()` helper to fetch receipt
- Uses `deleteReceipt()` helper to perform soft delete
- Logs deletion event
- Returns success/error response

**Security:**
- Only the receipt owner can delete their receipts
- Returns 403 Forbidden if non-owner attempts deletion
- Returns 404 if receipt not found or already deleted

### 5. Receipt List API Refactoring (`app/api/receipts/route.ts`)
**Simplified endpoint using helper functions:**
- Now uses `getReceipts()` helper from `receipt-scanner.ts`
- All query logic moved to reusable service layer
- Automatically filters out deleted receipts
- Cleaner, more maintainable code

**Benefits:**
- Single source of truth for receipt queries
- Easier to test and maintain
- Consistent filtering across all endpoints
- Reduced code duplication

### 5. Analytics Query Updates
**Updated analytics endpoints to exclude deleted receipts:**

#### `app/api/receipts/items/summary/route.ts`
- Added `sql\`${receipts.deletedAt} IS NULL\`` to WHERE clause
- Ensures AI spending insights don't include deleted receipts

#### `app/api/receipts/items/top/route.ts`
- Added `sql\`${receipts.deletedAt} IS NULL\`` to WHERE clause
- Ensures top items analysis excludes deleted receipts

### 6. UI Components (`components/receipts/receipt-detail-modal.tsx`)

#### New Component: `DeleteReceiptButton`
**Features:**
- Confirmation dialog before deletion
- Loading state during deletion
- Success/error toast notifications
- Invalidates React Query caches after deletion

**UI Elements:**
- Red destructive button with trash icon
- Alert dialog with clear warning message
- Explains that deletion removes from all households
- Cancel and confirm actions

#### Receipt Detail Modal Updates
- Added delete button next to assignment button
- Only visible to receipt owner
- Positioned in action button group
- Closes modal after successful deletion

**Permissions:**
- Delete button only shown if `isReceiptOwner === true`
- Assignment button shown if `canModifyReceipt === true`
- Clear separation between owner and household admin permissions

### 7. React Query Cache Invalidation
**After successful deletion, invalidates:**
- `["receipts"]` - Receipt list
- `["dashboard-stats"]` - Dashboard statistics
- `["recent-receipts"]` - Recent receipts widget
- `["spending-trends"]` - Spending trends chart

**Result:** All UI components automatically refresh with updated data

## User Experience

### For Receipt Owners
1. Open receipt detail modal
2. See "Delete" button next to "Assign to Household" button
3. Click "Delete" button
4. Confirmation dialog appears with warning
5. Click "Delete Receipt" to confirm
6. Receipt is deleted and modal closes
7. Receipt list automatically refreshes
8. Success toast notification appears

### For Non-Owners
- Delete button is not visible
- Only household admins can remove receipts from households (via assignment dialog)
- Cannot delete receipts they don't own

## Technical Details

### Soft Delete Benefits
1. **Data Preservation**: Receipts remain in database for audit/recovery
2. **Referential Integrity**: Foreign key relationships maintained
3. **Analytics History**: Past analytics remain accurate
4. **Undo Capability**: Could implement "restore" feature in future

### Query Performance
- All queries use `isNull(receipts.deletedAt)` filter
- Index on `deletedAt` column recommended for large datasets
- Minimal performance impact on existing queries

### Security Considerations
- Only receipt owner can delete
- Clerk authentication required
- Ownership verified before deletion
- Deletion logged for audit trail

## Future Enhancements

### Potential Features
1. **Restore Deleted Receipts**
   - Add "Trash" view to see deleted receipts
   - Allow owners to restore within 30 days
   - Permanent deletion after 30 days

2. **Bulk Delete**
   - Select multiple receipts
   - Delete all selected at once
   - Confirmation with count

3. **Admin Override**
   - Household admins can delete any household receipt
   - Requires additional permission check
   - Logs admin deletions separately

4. **Permanent Delete**
   - Add "Permanently Delete" option for deleted receipts
   - Removes from database entirely
   - Requires additional confirmation

5. **Deletion Notifications**
   - Notify household members when shared receipt is deleted
   - Email notification option
   - Activity log entry

## Testing Checklist

- [x] Delete button appears for receipt owner
- [x] Delete button hidden for non-owners
- [x] Confirmation dialog shows before deletion
- [x] Successful deletion closes modal
- [x] Receipt list refreshes after deletion
- [x] Deleted receipts don't appear in lists
- [x] Deleted receipts excluded from analytics
- [x] Toast notifications work correctly
- [x] Loading state shows during deletion
- [x] Error handling works for failed deletions
- [x] Logs deletion events properly
- [x] Database column added successfully

## API Documentation

### DELETE /api/receipts/:id

**Authentication:** Required (Clerk)

**Parameters:**
- `id` (path): Receipt UUID

**Response Success (200):**
```json
{
  "success": true,
  "message": "Receipt deleted successfully"
}
```

**Response Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not receipt owner
- `404 Not Found`: Receipt not found or already deleted
- `500 Internal Server Error`: Deletion failed

**Example:**
```typescript
const response = await fetch(`/api/receipts/${receiptId}`, {
  method: "DELETE",
});

if (response.ok) {
  const data = await response.json();
  console.log(data.message); // "Receipt deleted successfully"
}
```

## Conclusion

The soft delete feature provides a safe, user-friendly way for receipt owners to remove receipts from their account. The implementation maintains data integrity, excludes deleted receipts from all queries and analytics, and provides clear UI feedback throughout the deletion process.
