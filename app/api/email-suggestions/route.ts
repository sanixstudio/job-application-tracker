import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { emailTracking } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * Ensure email_tracking has parsed_result column (in case migration was not applied to this DB).
 */
async function ensureEmailTrackingSchema(connectionString: string) {
  const run = neon(connectionString);
  await run`ALTER TABLE "email_tracking" ADD COLUMN IF NOT EXISTS "parsed_result" jsonb`;
  await run`CREATE INDEX IF NOT EXISTS "idx_email_tracking_user_processed" ON "email_tracking" ("user_id", "processed")`;
}

/**
 * GET /api/email-suggestions
 * List unprocessed inbound emails with parsed suggestions for the current user.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const uid = userId;

    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        await ensureEmailTrackingSchema(connectionString);
      } catch {
        // Column/index may already exist
      }
    }

    const rows = await db
      .select({
        id: emailTracking.id,
        emailId: emailTracking.emailId,
        fromAddress: emailTracking.fromAddress,
        subject: emailTracking.subject,
        receivedDate: emailTracking.receivedDate,
        parsedResult: emailTracking.parsedResult,
      })
      .from(emailTracking)
      .where(and(eq(emailTracking.userId, uid), eq(emailTracking.processed, false)))
      .orderBy(desc(emailTracking.receivedDate))
      .limit(50);

    const suggestions = rows.filter(
      (r) => r.parsedResult && r.parsedResult.suggestedAction !== "dismiss"
    );

    return NextResponse.json({
      success: true,
      data: suggestions.map((s) => ({
        id: s.id,
        emailId: s.emailId,
        from: s.fromAddress,
        subject: s.subject,
        receivedDate: s.receivedDate,
        suggestedAction: s.parsedResult!.suggestedAction,
        suggestedStatus: s.parsedResult!.suggestedStatus,
        companyName: s.parsedResult!.companyName,
        jobTitle: s.parsedResult!.jobTitle,
      })),
    });
  } catch (error) {
    console.error("Email suggestions list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}
