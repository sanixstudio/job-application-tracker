import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Database connection for Neon PostgreSQL (serverless).
 * Uses HTTP driver for single-query serverless.
 * Set DATABASE_URL in .env when running the app or migrations.
 * Connection is lazy so build succeeds without DATABASE_URL.
 * @see https://orm.drizzle.team/docs/connect-neon
 * @see https://neon.tech/docs/guides/drizzle
 */

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

function getDb(): Db {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env for Neon PostgreSQL. See .env.example."
    );
  }
  _db = drizzle({ client: neon(connectionString), schema });
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
}) as Db;
export default db;
