ALTER TABLE "user_settings" ADD COLUMN "extension_api_key" text;
--> statement-breakpoint
CREATE INDEX "idx_user_settings_extension_api_key" ON "user_settings" USING btree ("extension_api_key");
