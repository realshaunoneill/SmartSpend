# Batch Upload & Error Handling Feature

## Overview
Implemented batch receipt uploading with comprehensive error handling, visual feedback, and retry functionality.

## Features Implemented

### 1. Batch Upload Component
**File**: `components/receipts/receipt-batch-upload.tsx`

- **Multiple File Selection**: Users can select and upload multiple receipts at once
- **Auto-Start Processing**: Automatically begins processing as soon as files are selected
- **Async Processing**: Uploads and processes receipts in parallel without blocking the UI
- **Real-time Progress**: Shows upload and processing progress for each receipt
- **Visual Queue**: Displays all receipts in a queue with status indicators
- **File Validation**: Validates file type (images only) and size (max 15MB)

**Features**:
- Drag & drop support (via file input)
- Preview thumbnails for each receipt
- Individual progress bars
- Status indicators (pending, uploading, processing, completed, failed)
- Remove items from queue
- Clear completed items
- Fire-and-forget processing (non-blocking)

### 2. Processing Status Tracking
**Schema Changes**: `lib/db/schema.ts`

Added new fields to `receipts` table:
```typescript
processingStatus: text('processing_status').notNull().default('pending')
// Values: 'pending' | 'processing' | 'completed' | 'failed'

processingError: text('processing_error')
// Stores error message if processing fails
```

**Migration**: `lib/db/migrations/add_processing_status.sql`
- Adds new columns
- Updates existing receipts to 'completed' status
- Creates index for performance

### 3. Failed Receipt Handling
**Visual Feedback**:
- Failed receipts shown with blurred image
- Red background overlay
- Error message displayed
- Retry button prominently displayed

**User Experience**:
- Failed receipts remain visible in the list
- Users can see what went wrong
- One-click retry functionality
- Non-intrusive error display

### 4. Retry Functionality
**API Endpoint**: `app/api/receipts/[id]/retry/route.ts`

**Features**:
- Validates receipt ownership
- Checks if receipt can be retried
- Re-processes with OpenAI
- Updates database with new data
- Handles retry failures gracefully

**Process**:
1. User clicks "Retry Processing" button
2. Receipt status updated to 'processing'
3. OpenAI analysis attempted again
4. On success: Updates receipt with extracted data
5. On failure: Updates with new error message

### 5. Enhanced Process Route
**File**: `app/api/receipt/process/route.ts`

**Improvements**:
- Wraps OpenAI call in try-catch
- Saves failed receipts to database
- Stores error messages for debugging
- Returns structured error responses
- Maintains processing status throughout

### 6. Updated Receipts Page
**File**: `app/receipts/page.tsx`

**Changes**:
- Replaced single upload with batch upload component
- Added visual indicators for failed receipts
- Implemented retry button in receipt cards
- Shows processing status (processing spinner)
- Blurs failed receipt images
- Displays error messages

## User Flow

### Batch Upload Flow
1. User selects multiple receipt images
2. Files added to upload queue with previews
3. **Auto-start**: Processing begins immediately for all files in parallel
4. Each receipt (processed asynchronously):
   - Uploads to Vercel Blob (25% progress)
   - Triggers async processing (50% progress)
   - Processing completes in background (100% progress)
5. User can continue working while receipts process
6. Completed receipts show green checkmark
7. Failed receipts show error with retry option
8. Receipts appear in the main list as they complete

### Failed Receipt Flow
1. Receipt processing fails (network, OpenAI, etc.)
2. Receipt saved to database with 'failed' status
3. Receipt appears in list with:
   - Blurred image
   - Red background
   - Error message
   - "Retry Processing" button
4. User clicks retry button
5. Receipt re-processed
6. On success: Receipt updates and displays normally
7. On failure: New error message shown

### Retry Flow
1. User clicks "Retry Processing" on failed receipt
2. API validates receipt and ownership
3. Status updated to 'processing'
4. OpenAI analysis attempted
5. Database updated with results
6. UI refreshes to show new status

## Technical Details

### Processing States
```typescript
type ProcessingStatus = 
  | 'pending'    // Just uploaded, not processed yet
  | 'processing' // Currently being processed
  | 'completed'  // Successfully processed
  | 'failed'     // Processing failed
```

### Error Handling
- **Network Errors**: Caught and stored with message
- **OpenAI Errors**: Caught and stored with message
- **Database Errors**: Logged and returned to user
- **Validation Errors**: Prevented before upload

### Performance Optimizations
- Sequential processing to avoid rate limits
- Progress indicators for user feedback
- Lazy loading of receipt images
- Indexed database queries
- Efficient state management

## API Endpoints

### POST /api/receipt/process
**Enhanced with error handling**
- Saves failed receipts to database
- Returns structured error responses
- Includes receipt ID in error response

### POST /api/receipts/[id]/retry
**New endpoint for retrying failed receipts**
- Validates ownership
- Re-processes receipt
- Updates database
- Returns updated receipt data

## Database Schema

### Receipts Table Updates
```sql
ALTER TABLE receipts 
ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN processing_error TEXT;

CREATE INDEX idx_receipts_processing_status ON receipts(processing_status);
```

## UI Components

### ReceiptBatchUpload
**Props**:
- `clerkId`: User's Clerk ID
- `userEmail`: User's email
- `householdId`: Optional household ID
- `onUploadComplete`: Callback when uploads complete

**State Management**:
- Upload queue with status tracking
- Progress tracking per item
- Error state per item
- Processing lock to prevent concurrent uploads

### Receipt Card (Updated)
**New Features**:
- Status-based styling
- Blur effect for failed receipts
- Error message display
- Retry button
- Processing spinner
- Conditional click handling

## Benefits

### For Users
✅ Upload multiple receipts at once
✅ See real-time progress
✅ Know immediately if something fails
✅ Retry failed receipts without re-uploading
✅ Clear error messages
✅ No data loss on failures

### For Developers
✅ Comprehensive error tracking
✅ Easy debugging with stored errors
✅ Graceful failure handling
✅ Retry logic without code duplication
✅ Clean separation of concerns
✅ Scalable architecture

## Future Enhancements

### Potential Improvements
1. **Automatic Retry**: Retry failed receipts automatically after a delay
2. **Batch Retry**: Retry all failed receipts at once
3. **Progress Persistence**: Save upload progress to survive page refreshes
4. **Background Processing**: Process receipts in background worker
5. **Webhook Integration**: Use webhooks for async processing
6. **Smart Retry**: Exponential backoff for retries
7. **Error Analytics**: Track common failure reasons
8. **Bulk Delete**: Delete multiple failed receipts at once

### Monitoring
- Track failure rates
- Monitor processing times
- Alert on high failure rates
- Log common error patterns

## Testing Checklist

- [ ] Upload single receipt
- [ ] Upload multiple receipts (2-10)
- [ ] Upload with network failure
- [ ] Upload with OpenAI failure
- [ ] Retry failed receipt successfully
- [ ] Retry failed receipt with continued failure
- [ ] Remove items from queue
- [ ] Clear completed items
- [ ] Process receipts sequentially
- [ ] View failed receipts in list
- [ ] Click retry button on failed receipt
- [ ] Verify error messages display correctly
- [ ] Check database status updates
- [ ] Verify processing status indicators

## Migration Steps

1. **Run Database Migration**:
   ```bash
   psql $DATABASE_URL < lib/db/migrations/add_processing_status.sql
   ```

2. **Deploy Code Changes**:
   - Deploy updated schema
   - Deploy new components
   - Deploy new API endpoints

3. **Verify**:
   - Test batch upload
   - Test error handling
   - Test retry functionality
   - Check database updates

## Rollback Plan

If issues occur:
1. Revert code changes
2. Keep database columns (backward compatible)
3. Old code will ignore new columns
4. Can remove columns later if needed

## Support

For issues or questions:
- Check error messages in failed receipts
- Review server logs for detailed errors
- Check database for processing status
- Verify OpenAI API key and limits
