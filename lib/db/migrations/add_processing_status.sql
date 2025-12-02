-- Add processing status fields to receipts table
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Update existing receipts to 'completed' status if they have merchant data
UPDATE receipts 
SET processing_status = 'completed' 
WHERE merchant_name IS NOT NULL AND processing_status = 'pending';

-- Create index for faster queries on processing status
CREATE INDEX IF NOT EXISTS idx_receipts_processing_status ON receipts(processing_status);
