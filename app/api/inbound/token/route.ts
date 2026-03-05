import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/inbound/token
 * Generate or return the user's inbound email token. Used in "Forward to trackr+TOKEN@..." address.
 * Clerk auth required.
 */
export async function POST() {
  try {
    const { userId } = await auth();

    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        const run = neon(connectionString);
        await run`ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "inbound_email_token" text`;
        await run`CREATE INDEX IF NOT EXISTS "idx_user_settings_inbound_email_token" ON "user_settings" ("inbound_email_token")`;
      } catch {
        // Column/index may already exist
      }
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await db
      .select({ inboundEmailToken: userSettings.inboundEmailToken })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    let token = existing?.inboundEmailToken ?? null;
    if (!token) {
      token = nanoid(24);
      const now = new Date();
      if (existing) {
        await db
          .update(userSettings)
          .set({ inboundEmailToken: token, updatedAt: now })
          .where(eq(userSettings.userId, userId));
      } else {
        await db.insert(userSettings).values({
          userId,
          inboundEmailToken: token,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        forwardAddress: `trackr+${token}@inbound.example.com`,
      },
    });
  } catch (error) {
    console.error("Inbound token error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
