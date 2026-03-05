import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import type { ApplicationStatus, JobSource, ResumeContent } from "@/types";

/**
 * Database schema for the Job Application Tracker.
 * PostgreSQL (Neon) – user-scoped data via Clerk userId.
 */

export const applications = pgTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobTitle: text("job_title").notNull(),
    companyName: text("company_name").notNull(),
    jobUrl: text("job_url").notNull(),
    applicationUrl: text("application_url"),
    status: text("status")
      .notNull()
      .$type<ApplicationStatus>()
      .default("applied"),
    appliedDate: timestamp("applied_date", { mode: "date" })
      .notNull()
      .defaultNow(),
    source: text("source").notNull().$type<JobSource>().default("manual"),
    emailId: text("email_id"),
    notes: text("notes"),
    salaryRange: text("salary_range"),
    location: text("location"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_applications_user_id").on(table.userId),
    index("idx_applications_status").on(table.status),
    index("idx_applications_user_status").on(table.userId, table.status),
  ]
);

/** Parsed suggestion from an inbound application email. */
export type ParsedEmailResult = {
  suggestedAction: "add" | "update" | "dismiss";
  suggestedStatus?: ApplicationStatus;
  companyName?: string;
  jobTitle?: string;
};

export const emailTracking = pgTable(
  "email_tracking",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    emailId: text("email_id").notNull().unique(),
    fromAddress: text("from_address").notNull(),
    subject: text("subject").notNull(),
    receivedDate: timestamp("received_date", { mode: "date" }).notNull(),
    processed: boolean("processed").notNull().default(false),
    jobLinks: text("job_links").notNull().default("[]"),
    /** Parser output: suggested action (add/update/dismiss), status, company/title when extracted. */
    parsedResult: jsonb("parsed_result").$type<ParsedEmailResult>(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_email_tracking_processed").on(table.processed),
    index("idx_email_tracking_user_processed").on(table.userId, table.processed),
  ]
);

export const userSettings = pgTable(
  "user_settings",
  {
    userId: text("user_id").primaryKey(),
    gmailAddress: text("gmail_address"),
    sheetsId: text("sheets_id"),
    checkFrequency: text("check_frequency")
      .notNull()
      .$type<"twice_daily" | "daily" | "hourly">()
      .default("twice_daily"),
    autoApply: boolean("auto_apply").notNull().default(false),
    /** API key for Chrome extension (X-Trackr-API-Key). Nullable; unique when set. */
    extensionApiKey: text("extension_api_key"),
    /** Token for inbound email: forward to trackr+TOKEN@inbound.example.com to associate email with this user. */
    inboundEmailToken: text("inbound_email_token"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_user_settings_extension_api_key").on(table.extensionApiKey),
    index("idx_user_settings_inbound_email_token").on(table.inboundEmailToken),
  ]
);

export const resumes = pgTable(
  "resumes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull().default("My Resume"),
    content: jsonb("content").$type<ResumeContent>().notNull().default({ sections: [] }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("idx_resumes_user_id").on(table.userId)]
);

/** Last 5 AI tailor responses per user for "Previous responses" in the Tailor modal. */
export const tailorHistory = pgTable(
  "tailor_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobDescriptionPreview: text("job_description_preview").notNull(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tailor_history_user_id").on(table.userId),
    index("idx_tailor_history_user_created").on(table.userId, table.createdAt),
  ]
);
