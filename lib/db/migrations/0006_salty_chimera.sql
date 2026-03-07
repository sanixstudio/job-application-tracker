CREATE TABLE "career_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"profile_url" text,
	"sections" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_career_profiles_user_id" ON "career_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_career_profiles_user_platform" ON "career_profiles" USING btree ("user_id","platform");