-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Households for sharing
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Household members (many-to-many)
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  merchant_name TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT,
  payment_method TEXT,
  image_url TEXT,
  raw_ocr_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipt items (line items from OCR)
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank connections (Revolut/Plaid)
CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'revolut', 'plaid'
  account_id TEXT NOT NULL,
  account_name TEXT,
  institution_name TEXT,
  access_token_encrypted TEXT, -- Store encrypted
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank transactions (synced from banks)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL, -- External transaction ID
  merchant_name TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT,
  description TEXT,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL, -- Link to receipt if matched
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bank_connection_id, transaction_id)
);

-- Subscription plans (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL, -- 'free', 'pro'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_household_id ON receipts(household_id);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
