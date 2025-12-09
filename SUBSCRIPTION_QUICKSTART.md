# 🚀 Quick Start: Subscription Feature

## Deploy to Production

### 1. Apply Database Migration
```bash
npx drizzle-kit push
```

This will:
- Add business expense fields to `receipts` table
- Create `subscriptions` table
- Create `subscription_payments` table
- Add 8 performance indexes

### 2. Verify Migration
```bash
# Check that tables exist
npx drizzle-kit introspect
```

### 3. Deploy Application
```bash
git add .
git commit -m "feat: Add subscription management and business expense tracking"
git push origin main
```

## User Guide

### For End Users

#### Adding a Subscription
1. Navigate to `/subscriptions`
2. Click "Add Subscription" button
3. Fill in:
   - Name (e.g., "Netflix")
   - Amount (e.g., 15.99)
   - Billing frequency (monthly/quarterly/yearly/custom)
   - Billing day (1-31)
   - Start date
   - Optional: Category, household, business expense toggle
4. Click "Create Subscription"

#### Viewing Subscription Details
1. Click any subscription card
2. See:
   - Financial summary
   - Next billing date
   - Payment history
   - Actions (pause/cancel/delete)

#### Marking Receipt as Business Expense
1. Open any receipt detail modal
2. Click "Mark as Business" button (or business expense badge if already marked)
3. Toggle business expense on
4. Select category
5. Add notes (optional)
6. Toggle tax deductible (if applicable)
7. Click "Save"

#### Tracking Missing Receipts
- Dashboard shows missing receipt count
- Each subscription card shows missing receipts alert
- Yellow badge indicates number of pending/missed payments

## API Reference

### List Subscriptions
```typescript
GET /api/subscriptions?householdId={id}&status={active|paused|cancelled}&includePayments=true
```

### Create Subscription
```typescript
POST /api/subscriptions
{
  "name": "Netflix",
  "amount": 15.99,
  "billingFrequency": "monthly",
  "billingDay": 1,
  "startDate": "2024-01-01",
  "category": "Streaming",
  "isBusinessExpense": false
}
```

### Update Subscription
```typescript
PATCH /api/subscriptions/[id]
{
  "status": "paused",
  "notes": "Taking a break"
}
```

### Link Receipt to Payment
```typescript
PATCH /api/subscriptions/payments/[paymentId]
{
  "receiptId": "receipt-uuid"
}
```

### Mark Receipt as Business Expense
```typescript
PATCH /api/receipts/[id]
{
  "isBusinessExpense": true,
  "businessCategory": "Software & Tools",
  "taxDeductible": true
}
```

## React Query Hooks

### Basic Usage
```typescript
// List subscriptions
const { data: subscriptions } = useSubscriptions();

// Get single subscription
const { data: subscription } = useSubscription(id);

// Create subscription
const { mutate: create } = useCreateSubscription();
create({ name: "Netflix", amount: 15.99, ... });

// Update subscription
const { mutate: update } = useUpdateSubscription(id);
update({ status: "paused" });

// Delete subscription
const { mutate: remove } = useDeleteSubscription();
remove(id);

// Link receipt to payment
const { mutate: linkReceipt } = useUpdatePayment(subscriptionId);
linkReceipt({ 
  paymentId: "payment-uuid", 
  data: { receiptId: "receipt-uuid" } 
});
```

## Troubleshooting

### Migration Fails
**Error:** "relation already exists"
- Check if tables were partially created
- Drop tables manually if needed:
  ```sql
  DROP TABLE subscription_payments;
  DROP TABLE subscriptions;
  ALTER TABLE receipts DROP COLUMN is_business_expense;
  ```
- Run migration again

### Subscriptions Not Showing
- Check user is authenticated
- Verify subscriptions table has data
- Check browser console for API errors
- Verify `status` filter (try "active" first)

### Business Expense Badge Not Showing
- Verify user is the receipt owner
- Check `isReceiptOwner` permission in modal
- Ensure receipt has `isBusinessExpense: true`

### TypeScript Errors
- Run `npm install` to ensure all dependencies installed
- Check `lib/db/schema.ts` exports types correctly
- Verify imports in component files

## Common Patterns

### Filter by Status
```typescript
const { data } = useSubscriptions(undefined, 'active');
```

### Filter by Household
```typescript
const { data } = useSubscriptions(householdId);
```

### Include Payment Data
```typescript
const { data } = useSubscriptions(undefined, 'active', true);
// Now subscriptions include missingPayments count
```

### Calculate Monthly Cost
```typescript
const totalMonthly = subscriptions.reduce((sum, sub) => {
  const amount = parseFloat(sub.amount);
  if (sub.billingFrequency === 'monthly') return sum + amount;
  if (sub.billingFrequency === 'quarterly') return sum + (amount / 3);
  if (sub.billingFrequency === 'yearly') return sum + (amount / 12);
  return sum;
}, 0);
```

## Database Schema Quick Reference

### subscriptions
- `id` - UUID primary key
- `user_id` - Owner
- `household_id` - Optional household
- `name` - Subscription name
- `amount` - Price (stored as text)
- `billing_frequency` - monthly/quarterly/yearly/custom
- `billing_day` - 1-31
- `status` - active/paused/cancelled
- `is_business_expense` - Boolean
- `next_billing_date` - When next payment due
- Indexes: user_id, household_id, next_billing_date, status

### subscription_payments
- `id` - UUID primary key
- `subscription_id` - FK to subscriptions
- `receipt_id` - Optional FK to receipts
- `expected_date` - When payment due
- `expected_amount` - Expected price
- `actual_date` - When receipt recorded
- `actual_amount` - Actual price paid
- `status` - pending/paid/missed/cancelled
- Indexes: subscription_id, receipt_id, expected_date, status

### receipts (new fields)
- `is_business_expense` - Boolean
- `business_category` - Text
- `business_notes` - Text
- `tax_deductible` - Boolean

## Performance Tips

1. **Use includePayments sparingly** - Only fetch when needed
2. **Filter by status** - Reduces data transfer
3. **Leverage indexes** - All common queries indexed
4. **React Query caching** - Automatic caching prevents redundant requests
5. **Batch operations** - Use bulk update when possible (future feature)

## Support

For issues or questions:
1. Check this guide
2. Review TypeScript errors in IDE
3. Check browser console for API errors
4. Review SUBSCRIPTION_IMPLEMENTATION_COMPLETE.md for detailed documentation
