# Business Expense & Subscription Tracking Features

## Overview
Extending SmartSpend to support business expense tracking and subscription management for indie/freelance workers and small businesses.

## Features

### 1. Business Expense Tracking
**Goal**: Mark receipts as business expenses and track them separately for tax purposes

**Database Changes**:
- Add `isBusinessExpense` boolean to receipts table
- Add `businessCategory` text field (e.g., "Software", "Equipment", "Travel", "Meals", "Office Supplies")
- Add `businessNotes` text field for additional context
- Add `taxDeductible` boolean flag
- Add `taxYear` field (derived from transaction date)

**UI Components**:
- Toggle in receipt upload to mark as business expense
- Business expense badge in receipt cards
- Filter option to show only business expenses
- Business category selector

**API Endpoints**:
- PATCH `/api/receipts/[id]` - Update business expense fields
- GET `/api/receipts/business` - Get all business expenses with filters

### 2. Tax Export & Reporting
**Goal**: Export business expenses for tax filing

**Features**:
- Export to CSV/Excel with customizable date ranges
- Filter by tax year, category, household
- Include fields: Date, Merchant, Amount, Category, Business Category, Notes, Receipt Image URL
- Summary totals by category
- PDF report generation (future enhancement)

**API Endpoints**:
- GET `/api/exports/business-expenses` - Download CSV/Excel
- GET `/api/reports/tax-summary` - Get summary data for a tax year

**UI Components**:
- Export button on receipts page
- Tax year selector
- Export format options (CSV, Excel)
- Preview of export data before download

### 3. Subscription Management
**Goal**: Track recurring subscriptions and link receipts to payments

**Database Schema**:

```sql
-- Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  
  -- Subscription Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'Software', 'Streaming', 'Utilities', 'Insurance', etc.
  
  -- Financial Info
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Recurrence
  billing_frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly', 'custom'
  billing_day INTEGER NOT NULL, -- Day of month (1-31)
  custom_frequency_days INTEGER, -- For custom frequency
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled'
  is_business_expense BOOLEAN DEFAULT FALSE,
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP, -- NULL for ongoing
  next_billing_date TIMESTAMP NOT NULL,
  last_payment_date TIMESTAMP,
  
  -- Metadata
  website TEXT,
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscription Payments (Links receipts to subscriptions)
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  
  -- Payment Info
  expected_date TIMESTAMP NOT NULL,
  expected_amount TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'missed', 'cancelled'
  
  -- Actual payment (if receipt linked)
  actual_date TIMESTAMP,
  actual_amount TEXT,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Features**:
- Create/Edit/Delete subscriptions
- Link receipts to subscription payments (manual or automatic)
- Auto-generate expected payments based on billing frequency
- Mark payments as paid/missed
- View missing receipts for subscriptions
- Calculate total subscription costs (monthly/yearly)
- Business expense flag for tax deduction tracking

**UI Components**:
- Subscriptions dashboard page
- Subscription card showing:
  - Name, logo/icon, amount
  - Next billing date
  - Status (active/paused/cancelled)
  - Missing receipts count
  - Total cost this year
- Subscription creation dialog
- Receipt linking interface
- Missing payments view
- Subscription timeline (payment history)

**API Endpoints**:
- GET `/api/subscriptions` - List all subscriptions
- POST `/api/subscriptions` - Create subscription
- GET `/api/subscriptions/[id]` - Get subscription details
- PATCH `/api/subscriptions/[id]` - Update subscription
- DELETE `/api/subscriptions/[id]` - Delete subscription
- GET `/api/subscriptions/[id]/payments` - Get payment history
- POST `/api/subscriptions/[id]/payments/link` - Link receipt to payment
- GET `/api/subscriptions/missing-receipts` - Get all missing receipts
- GET `/api/subscriptions/summary` - Get spending summary

### 4. Automatic Receipt Matching
**Goal**: Automatically suggest linking receipts to subscriptions

**Logic**:
- Match by merchant name and amount
- Match by date proximity (±3 days from expected)
- Suggest matches in UI for user confirmation
- Learn from user confirmations to improve matching

**API Endpoints**:
- GET `/api/subscriptions/[id]/suggested-receipts` - Get matching receipts
- POST `/api/subscriptions/learn-match` - Store user's match confirmation

### 5. Subscription Analytics
**Goal**: Provide insights into subscription spending

**Features**:
- Total monthly/yearly subscription cost
- Most expensive subscriptions
- Subscriptions by category breakdown
- Spending trends over time
- Unused subscriptions detection (no activity)
- Subscription health score

**UI Components**:
- Subscription analytics dashboard
- Charts: Pie chart by category, line chart over time
- Alerts for missed payments
- Recommendations for cost savings

## Implementation Priority

### Phase 1 (MVP)
1. ✅ Database schema updates
2. Add business expense toggle to receipts
3. Basic subscription CRUD operations
4. Subscriptions list page
5. Link receipts to subscriptions manually

### Phase 2
1. Business expense export (CSV)
2. Missing receipts detection
3. Subscription payment timeline
4. Basic analytics

### Phase 3
1. Automatic receipt matching
2. Advanced analytics
3. Tax year reports
4. PDF export
5. Subscription reminders

## Database Migration Script

```sql
-- Add business expense fields to receipts
ALTER TABLE receipts 
ADD COLUMN is_business_expense BOOLEAN DEFAULT FALSE,
ADD COLUMN business_category TEXT,
ADD COLUMN business_notes TEXT,
ADD COLUMN tax_deductible BOOLEAN DEFAULT FALSE;

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  billing_frequency TEXT NOT NULL,
  billing_day INTEGER NOT NULL,
  custom_frequency_days INTEGER,
  
  status TEXT NOT NULL DEFAULT 'active',
  is_business_expense BOOLEAN DEFAULT FALSE,
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP NOT NULL,
  last_payment_date TIMESTAMP,
  
  website TEXT,
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  
  expected_date TIMESTAMP NOT NULL,
  expected_amount TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  
  actual_date TIMESTAMP,
  actual_amount TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_receipts_business_expense ON receipts(is_business_expense) WHERE is_business_expense = TRUE;
CREATE INDEX idx_receipts_business_category ON receipts(business_category) WHERE business_category IS NOT NULL;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_household_id ON subscriptions(household_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_receipt_id ON subscription_payments(receipt_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
```

## UI/UX Mockups

### Subscriptions Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ Subscriptions                                    + New  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📊 Overview                                              │
│ ┌──────────────┬──────────────┬──────────────────────┐ │
│ │ Total/Month  │ Active       │ Missing Receipts     │ │
│ │ €847.32      │ 12          │ 3                    │ │
│ └──────────────┴──────────────┴──────────────────────┘ │
│                                                          │
│ 🔴 Active Subscriptions                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🎵 Spotify Premium              €9.99/mo  [📄]     │ │
│ │    Next: Jan 15 · Business Expense                 │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ ☁️  Vercel Pro                  €20.00/mo  [⚠️]    │ │
│ │    Next: Jan 20 · Missing receipt                  │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ 📧 Google Workspace            €12.00/mo  [📄]     │ │
│ │    Next: Jan 1 · Business Expense                  │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Receipt Upload with Business Expense
```
┌─────────────────────────────────────────────┐
│ Upload Receipt                              │
├─────────────────────────────────────────────┤
│                                             │
│ [Drop files here or click to upload]       │
│                                             │
│ ☐ Business Expense                          │
│                                             │
│ Business Category (if checked):             │
│ [Software ▼]                                │
│                                             │
│ Notes:                                      │
│ [________________________]                  │
│                                             │
│ ☑ Tax Deductible                            │
│                                             │
│           [Cancel]  [Upload]                │
└─────────────────────────────────────────────┘
```

## Benefits

1. **For Freelancers/Indie Hackers**:
   - Track business expenses separately
   - Easy tax filing with exports
   - Monitor subscription costs
   - Identify missing receipts

2. **For Small Businesses**:
   - Team expense tracking (via households)
   - Budget monitoring
   - Subscription cost optimization
   - Audit trail for expenses

3. **For Personal Use**:
   - Subscription management
   - Cost awareness
   - Budget tracking
   - Financial organization

## Technical Considerations

1. **Performance**: Index business expense receipts and subscription queries
2. **Data Privacy**: Business expenses might be sensitive
3. **Backup**: Important for tax records
4. **Automation**: Calculate next billing dates automatically
5. **Notifications**: Remind users of upcoming subscriptions
6. **Export Format**: Ensure CSV/Excel format is tax-software compatible

## Future Enhancements

- [ ] Subscription price change detection
- [ ] Sharing subscriptions within household
- [ ] Integration with accounting software (QuickBooks, Xero)
- [ ] Annual subscription renewal reminders
- [ ] Subscription comparison/alternatives suggestions
- [ ] Multi-currency subscription tracking
- [ ] Receipt OCR improvements for subscription detection
- [ ] Mobile app for quick business expense capture
- [ ] Bank integration for automatic subscription detection
- [ ] Trial subscription tracking (auto-cancel before charge)
