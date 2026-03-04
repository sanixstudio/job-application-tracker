CREATE TABLE "tailor_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_description_preview" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_tailor_history_user_id" ON "tailor_history" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_tailor_history_user_created" ON "tailor_history" USING btree ("user_id","created_at");
