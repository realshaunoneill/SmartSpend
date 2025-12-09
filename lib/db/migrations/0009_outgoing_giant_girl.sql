CREATE TABLE "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"receipt_id" uuid,
	"expected_date" timestamp NOT NULL,
	"expected_amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"actual_date" timestamp,
	"actual_amount" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"household_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"billing_frequency" text NOT NULL,
	"billing_day" integer NOT NULL,
	"custom_frequency_days" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"is_business_expense" boolean DEFAULT false,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"next_billing_date" timestamp NOT NULL,
	"last_payment_date" timestamp,
	"website" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "is_business_expense" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "business_category" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "business_notes" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "tax_deductible" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;