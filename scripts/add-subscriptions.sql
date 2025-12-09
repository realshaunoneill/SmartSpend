-- Migration: Add business expense and subscription tracking
-- Date: 2025-12-09

-- Add business expense fields to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS is_business_expense BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_category TEXT,
ADD COLUMN IF NOT EXISTS business_notes TEXT,
ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT FALSE;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  
  -- Subscription Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  -- Financial Info
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Recurrence
  billing_frequency TEXT NOT NULL,
  billing_day INTEGER NOT NULL,
  custom_frequency_days INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
  is_business_expense BOOLEAN DEFAULT FALSE,
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  next_billing_date TIMESTAMP NOT NULL,
  last_payment_date TIMESTAMP,
  
  -- Metadata
  website TEXT,
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  
  -- Payment Info
  expected_date TIMESTAMP NOT NULL,
  expected_amount TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Actual payment (if receipt linked)
  actual_date TIMESTAMP,
  actual_amount TEXT,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_business_expense ON receipts(is_business_expense) WHERE is_business_expense = TRUE;
CREATE INDEX IF NOT EXISTS idx_receipts_business_category ON receipts(business_category) WHERE business_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_household_id ON subscriptions(household_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_receipt_id ON subscription_payments(receipt_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- Add comments
COMMENT ON TABLE subscriptions IS 'Stores recurring subscription information';
COMMENT ON TABLE subscription_payments IS 'Links receipts to subscription payments and tracks payment status';
COMMENT ON COLUMN receipts.is_business_expense IS 'Flag indicating if receipt is a business expense';
COMMENT ON COLUMN receipts.business_category IS 'Business expense category (Software, Equipment, Travel, etc.)';
COMMENT ON COLUMN subscriptions.billing_frequency IS 'How often the subscription bills: monthly, quarterly, yearly, custom';
COMMENT ON COLUMN subscriptions.billing_day IS 'Day of month when subscription bills (1-31)';
COMMENT ON COLUMN subscription_payments.status IS 'Payment status: pending, paid, missed, cancelled';
