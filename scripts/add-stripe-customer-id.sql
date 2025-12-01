-- Migration: Add stripe_customer_id to users table
-- Run this to add Stripe customer ID tracking

-- Add stripe_customer_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for subscription management';