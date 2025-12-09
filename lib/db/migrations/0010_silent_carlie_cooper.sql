CREATE INDEX "subscription_payments_subscription_id_idx" ON "subscription_payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_receipt_id_idx" ON "subscription_payments" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_expected_date_idx" ON "subscription_payments" USING btree ("expected_date");--> statement-breakpoint
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_household_id_idx" ON "subscriptions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "subscriptions_next_billing_date_idx" ON "subscriptions" USING btree ("next_billing_date");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");