-- Migration to add enhanced receipt processing fields
-- Run this to update your database schema

-- Add new fields to receipt_items table
ALTER TABLE receipt_items 
ADD COLUMN IF NOT EXISTS unit_price TEXT,
ADD COLUMN IF NOT EXISTS total_price TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing receipt_items to populate unit_price and total_price from price
UPDATE receipt_items 
SET unit_price = price, total_price = price 
WHERE unit_price IS NULL AND price IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant_name ON receipts(merchant_name);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_date ON receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);
CREATE INDEX IF NOT EXISTS idx_receipt_items_name ON receipt_items(name);

-- Add comments for documentation
COMMENT ON COLUMN receipt_items.unit_price IS 'Price per individual item';
COMMENT ON COLUMN receipt_items.total_price IS 'Total price for this line item (unit_price * quantity)';
COMMENT ON COLUMN receipt_items.category IS 'Category of the individual item';
COMMENT ON COLUMN receipt_items.description IS 'Additional description or details about the item';