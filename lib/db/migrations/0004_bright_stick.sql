ALTER TABLE "receipt_items" ADD COLUMN "unit_price" text;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD COLUMN "total_price" text;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "processing_tokens" jsonb;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id");