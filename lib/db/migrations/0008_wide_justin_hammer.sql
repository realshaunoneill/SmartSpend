CREATE TABLE "insights_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"household_id" uuid,
	"cache_type" text NOT NULL,
	"cache_key" text NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insights_cache_user_id_cache_type_cache_key_unique" UNIQUE("user_id","cache_type","cache_key")
);
--> statement-breakpoint
ALTER TABLE "insights_cache" ADD CONSTRAINT "insights_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights_cache" ADD CONSTRAINT "insights_cache_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;