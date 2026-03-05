-- Email parsing: parsed_result on email_tracking, inbound_email_token on user_settings
ALTER TABLE "email_tracking" ADD COLUMN IF NOT EXISTS "parsed_result" jsonb;
CREATE INDEX IF NOT EXISTS "idx_email_tracking_user_processed" ON "email_tracking" ("user_id", "processed");

ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "inbound_email_token" text;
CREATE INDEX IF NOT EXISTS "idx_user_settings_inbound_email_token" ON "user_settings" ("inbound_email_token");
