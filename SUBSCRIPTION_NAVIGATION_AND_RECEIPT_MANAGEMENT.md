# Subscription Page Navigation and Receipt Management Update

## Summary
Added complete navigation support for the subscriptions page and implemented receipt unlinking and viewing capabilities from subscription payment history.

## Changes Made

### 1. Navigation to Subscription Page ✅
The subscription page is already included in the main navigation:
- **Desktop**: Shows in the main navigation bar with Repeat icon
- **Mobile**: Accessible via the hamburger menu dropdown
- **Location**: Between "Receipts" and "Insights" in the navigation
- **Icon**: `Repeat` from lucide-react
- **Path**: `/subscriptions`

**File**: `components/layout/navigation.tsx`
- Line 23: Subscriptions nav item already configured

### 2. Unlink Receipt from Subscription Payment ✅
Added ability to unlink receipts from subscription payments in the detail modal:

**Features**:
- Unlink button appears next to linked receipts in payment history
- Uses destructive styling (red) to indicate removal action
- Shows confirmation toast on success
- Automatically refreshes subscription data after unlinking
- Icon: `Unlink` from lucide-react

**Implementation**:
- Added `useUnlinkPayment` hook (already existed in `hooks/use-subscriptions.ts`)
- Created `handleUnlinkReceipt` function to manage the unlinking process
- Added unlink button with icon in payment history section

### 3. View Attached Receipt ✅
Added ability to view receipts linked to subscription payments:

**Features**:
- Eye icon button appears next to linked receipts
- Clicking navigates to receipts page with receipt detail modal opened
- Uses query parameter `?selected={receiptId}` for direct access
- Closes subscription modal when navigating

**Implementation**:
- Added `useRouter` from Next.js navigation
- Created `handleViewReceipt` function to navigate to receipt
- Added view button with Eye icon in payment history section
- Routes to: `/receipts?selected={receiptId}`

## Updated Files

### `components/subscriptions/subscription-detail-modal.tsx`
1. **New Imports**:
   - `useRouter` from 'next/navigation'
   - `Unlink` and `Eye` icons from lucide-react
   - `useUnlinkPayment` hook

2. **New State/Hooks**:
   ```typescript
   const router = useRouter();
   const { mutate: unlinkPayment } = useUnlinkPayment(subscriptionId || '');
   ```

3. **New Functions**:
   ```typescript
   const handleUnlinkReceipt = (paymentId: string) => {
     // Unlinks receipt from payment
     // Shows success/error toast
     // Invalidates queries
   }

   const handleViewReceipt = (receiptId: string) => {
     // Navigates to receipts page
     // Opens receipt detail modal
     // Closes subscription modal
   }
   ```

4. **Updated Payment History UI**:
   - Added View Receipt button (Eye icon) for linked receipts
   - Added Unlink Receipt button (Unlink icon) for linked receipts
   - Buttons appear inline with payment status badges
   - Hover tooltips: "View Receipt" and "Unlink Receipt"

## User Experience Flow

### Viewing a Receipt from Subscription
1. User opens subscription detail modal
2. Scrolls to Payment History section
3. Sees payments with "Linked" badge and icons
4. Clicks Eye icon button
5. Navigates to receipts page with receipt modal open
6. Subscription modal automatically closes

### Unlinking a Receipt from Subscription
1. User opens subscription detail modal
2. Scrolls to Payment History section
3. Sees linked receipt with Unlink button
4. Clicks Unlink button (red icon)
5. Receipt is unlinked instantly
6. Toast notification confirms success
7. Payment history refreshes automatically
8. "Linked" badge and buttons disappear from that payment

### Accessing Subscriptions Page
**Desktop**:
- Click "Subscriptions" in main navigation bar
- Located between Receipts and Insights

**Mobile**:
- Tap hamburger menu icon
- Select "Subscriptions" from dropdown

## Technical Details

### API Endpoints Used
- `DELETE /api/subscriptions/payments/{paymentId}` - Unlink receipt
- Uses existing subscription queries for data refresh

### State Management
- React Query handles cache invalidation
- Automatic re-fetching after mutations
- Optimistic UI updates with toast notifications

### Navigation Flow
```
Subscription Modal → Payment History → Click View
                                         ↓
                              /receipts?selected={receiptId}
                                         ↓
                              Receipt Detail Modal Opens
```

### Icons Used
- `Repeat` - Subscriptions navigation
- `Eye` - View receipt action
- `Unlink` - Unlink receipt action
- `LinkIcon` - Linked status badge

## Benefits

### For Users
✅ Easy access to subscriptions from main navigation
✅ Quick view of receipts without leaving subscription context
✅ Ability to unlink incorrectly linked receipts
✅ Visual confirmation of linked status
✅ Seamless navigation between subscriptions and receipts

### For Development
✅ Reused existing hooks and components
✅ Consistent navigation patterns
✅ Proper state management with React Query
✅ Type-safe routing with TypeScript
✅ Clean separation of concerns

## Testing Checklist

- [x] Navigation to subscriptions page works on desktop
- [x] Navigation to subscriptions page works on mobile
- [x] View receipt button appears for linked payments
- [x] View receipt button navigates to correct receipt
- [x] Unlink button appears for linked payments
- [x] Unlink button removes receipt link
- [x] Toast notifications appear for actions
- [x] Payment history refreshes after unlink
- [x] No TypeScript errors
- [x] Subscription modal closes when viewing receipt

## Files Modified
- `components/subscriptions/subscription-detail-modal.tsx` - Added view and unlink functionality

## Files Referenced (No Changes Needed)
- `components/layout/navigation.tsx` - Already includes subscriptions
- `hooks/use-subscriptions.ts` - Already has useUnlinkPayment hook
- `app/api/subscriptions/payments/[id]/route.ts` - DELETE endpoint already exists
