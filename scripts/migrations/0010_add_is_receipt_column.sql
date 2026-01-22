-- Add is_receipt column to receipts table
-- This field tracks whether an uploaded image is actually a receipt (AI-detected)

ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS is_receipt BOOLEAN DEFAULT true;

-- Update existing receipts to assume they are receipts
UPDATE receipts 
SET is_receipt = true 
WHERE is_receipt IS NULL;

-- Add comment to the column
COMMENT ON COLUMN receipts.is_receipt IS 'Whether this image is actually a receipt/invoice/purchase document (AI-detected). False for screenshots, memes, random images, etc.';
