-- Add processing_tokens column to receipts table
-- This stores the OpenAI token usage for cost calculation

ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS processing_tokens JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN receipts.processing_tokens IS 'OpenAI token usage: { promptTokens, completionTokens, totalTokens }';

-- Create index for token analysis queries (optional)
CREATE INDEX IF NOT EXISTS idx_receipts_processing_tokens ON receipts(processing_tokens) WHERE processing_tokens IS NOT NULL;
