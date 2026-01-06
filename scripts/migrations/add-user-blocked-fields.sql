-- Add blocked user fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Create index for quick lookup of blocked users
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users (is_blocked) WHERE is_blocked = true;
