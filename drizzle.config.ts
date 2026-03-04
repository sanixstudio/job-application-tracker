import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Load .env.local (and .env) so DATABASE_URL is set when running drizzle-kit from CLI
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
