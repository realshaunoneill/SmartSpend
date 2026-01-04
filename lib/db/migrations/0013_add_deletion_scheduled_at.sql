-- Add deletion_scheduled_at column to users table for soft delete scheduling
ALTER TABLE "users" ADD COLUMN "deletion_scheduled_at" timestamp;

