-- Add modifiers column to receipt_items table
ALTER TABLE receipt_items 
ADD COLUMN IF NOT EXISTS modifiers JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN receipt_items.modifiers IS 'Array of item modifiers: [{ name: string, price: number, type: "fee" | "deposit" | "discount" | "addon" | "modifier" }]';

-- Create index for faster queries on items with modifiers
CREATE INDEX IF NOT EXISTS idx_receipt_items_modifiers ON receipt_items USING GIN (modifiers);
