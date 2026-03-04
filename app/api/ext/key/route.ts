import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/ext/key
 * Generate an API key for the Chrome extension. Clerk auth required.
 * Returns the key once; store it in the extension (e.g. options page).
 * Idempotent: calling again overwrites the previous key.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure extension_api_key column exists (in case migration wasn't applied to this DB)
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        const run = neon(connectionString);
        await run`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "extension_api_key" text`;
        await run`CREATE INDEX IF NOT EXISTS "idx_user_settings_extension_api_key" ON "user_settings" ("extension_api_key")`;
      } catch {
        // Column/index may already exist; continue
      }
    }

    const key = nanoid(32);
    const now = new Date();

    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userSettings)
        .set({ extensionApiKey: key, updatedAt: now })
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        extensionApiKey: key,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true, data: { key } });
  } catch (error) {
    console.error("Extension key generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate key" },
      { status: 500 }
    );
  }
}
