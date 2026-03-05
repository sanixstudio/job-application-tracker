-- Profile checklist: LinkedIn and GitHub URLs on user_settings
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "linkedin_url" text;
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "github_url" text;
