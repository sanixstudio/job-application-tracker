import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

/**
 * Database connection and initialization
 * Uses SQLite for local development (easily migratable to PostgreSQL for production)
 */

const sqlite = new Database("dev.db");
const db = drizzle(sqlite, { schema });

/**
 * Initialize database tables if they don't exist
 * In production, use proper migrations with drizzle-kit
 */
export function initDatabase() {
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      job_title TEXT NOT NULL,
      company_name TEXT NOT NULL,
      job_url TEXT NOT NULL,
      application_url TEXT,
      status TEXT NOT NULL DEFAULT 'applied',
      applied_date INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      email_id TEXT,
      notes TEXT,
      salary_range TEXT,
      location TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_tracking (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      email_id TEXT NOT NULL UNIQUE,
      from_address TEXT NOT NULL,
      subject TEXT NOT NULL,
      received_date INTEGER NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      job_links TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY DEFAULT 'default_user',
      gmail_address TEXT,
      sheets_id TEXT,
      check_frequency TEXT NOT NULL DEFAULT 'twice_daily',
      auto_apply INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_email_tracking_processed ON email_tracking(processed);
  `);
}

// Initialize on import
initDatabase();

export { db };
export default db;
