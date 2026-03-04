CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_title" text NOT NULL,
	"company_name" text NOT NULL,
	"job_url" text NOT NULL,
	"application_url" text,
	"status" text DEFAULT 'applied' NOT NULL,
	"applied_date" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"email_id" text,
	"notes" text,
	"salary_range" text,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_id" text NOT NULL,
	"from_address" text NOT NULL,
	"subject" text NOT NULL,
	"received_date" timestamp NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"job_links" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_tracking_email_id_unique" UNIQUE("email_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"gmail_address" text,
	"sheets_id" text,
	"check_frequency" text DEFAULT 'twice_daily' NOT NULL,
	"auto_apply" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_applications_user_id" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_applications_user_status" ON "applications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_email_tracking_processed" ON "email_tracking" USING btree ("processed");