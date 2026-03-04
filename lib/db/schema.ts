import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { ApplicationStatus, JobSource } from "@/types";

/**
 * Database schema for the Job Application Automation System
 * Using SQLite for local development, easily migratable to PostgreSQL
 */

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default_user"), // For MVP, single user
  jobTitle: text("job_title").notNull(),
  companyName: text("company_name").notNull(),
  jobUrl: text("job_url").notNull(),
  applicationUrl: text("application_url"),
  status: text("status")
    .notNull()
    .$type<ApplicationStatus>()
    .default("applied"),
  appliedDate: integer("applied_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  source: text("source").notNull().$type<JobSource>().default("manual"),
  emailId: text("email_id"),
  notes: text("notes"),
  salaryRange: text("salary_range"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const emailTracking = sqliteTable("email_tracking", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default_user"),
  emailId: text("email_id").notNull().unique(),
  fromAddress: text("from_address").notNull(),
  subject: text("subject").notNull(),
  receivedDate: integer("received_date", { mode: "timestamp" }).notNull(),
  processed: integer("processed", { mode: "boolean" }).notNull().default(false),
  jobLinks: text("job_links").notNull().$defaultFn(() => "[]"), // JSON array stored as text
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey().default("default_user"),
  gmailAddress: text("gmail_address"),
  sheetsId: text("sheets_id"),
  checkFrequency: text("check_frequency")
    .notNull()
    .$type<"twice_daily" | "daily" | "hourly">()
    .default("twice_daily"),
  autoApply: integer("auto_apply", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
