ALTER TABLE "receipt_items" ADD COLUMN "modifiers" jsonb;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "processing_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "processing_error" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_household_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_default_household_id_households_id_fk" FOREIGN KEY ("default_household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;