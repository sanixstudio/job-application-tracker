CREATE TABLE "tailor_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_description_preview" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_tracking" ADD COLUMN "parsed_result" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "extension_api_key" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "inbound_email_token" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_url" text;--> statement-breakpoint
CREATE INDEX "idx_tailor_history_user_id" ON "tailor_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tailor_history_user_created" ON "tailor_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_email_tracking_user_processed" ON "email_tracking" USING btree ("user_id","processed");--> statement-breakpoint
CREATE INDEX "idx_user_settings_extension_api_key" ON "user_settings" USING btree ("extension_api_key");--> statement-breakpoint
CREATE INDEX "idx_user_settings_inbound_email_token" ON "user_settings" USING btree ("inbound_email_token");