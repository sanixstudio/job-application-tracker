import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import type { ApplicationStatus, JobSource } from "@/types";

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
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("idx_email_tracking_processed").on(table.processed)]
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  gmailAddress: text("gmail_address"),
  sheetsId: text("sheets_id"),
  checkFrequency: text("check_frequency")
    .notNull()
    .$type<"twice_daily" | "daily" | "hourly">()
    .default("twice_daily"),
  autoApply: boolean("auto_apply").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
