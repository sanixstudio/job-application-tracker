import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import { emailTracking, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parseEmailContent } from "@/lib/email/parser";
import type { ParsedEmailResult } from "@/lib/db/schema";

/** Ensure email_tracking has parsed_result column (in case migration was not applied). */
async function ensureEmailTrackingSchema(connectionString: string) {
  const run = neon(connectionString);
  await run`ALTER TABLE "email_tracking" ADD COLUMN IF NOT EXISTS "parsed_result" jsonb`;
  await run`CREATE INDEX IF NOT EXISTS "idx_email_tracking_user_processed" ON "email_tracking" ("user_id", "processed")`;
}

/**
 * Extract user token from recipient address.
 * Expects format: trackr+TOKEN@domain or trackr+TOKEN (local).
 */
function extractTokenFromTo(to: string): string | null {
  if (!to || typeof to !== "string") return null;
  const match = to.trim().match(/trackr\+([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Normalize inbound payload: support Resend (type + data) or generic { to, from, subject, text }.
 */
function normalizePayload(body: unknown): { to: string; from: string; subject: string; text: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (o.type === "email.received" && o.data && typeof o.data === "object") {
    const data = o.data as Record<string, unknown>;
    const to = [data.to, data.recipient].find((x) => typeof x === "string") as string | undefined;
    const from = [data.from, data.sender].find((x) => typeof x === "string") as string | undefined;
    const subject = typeof data.subject === "string" ? data.subject : "";
    const text = [data.text, data["text/plain"], data.body].find((x) => typeof x === "string") as string | undefined;
    if (to && from != null) return { to, from: from ?? "", subject, text: text ?? "" };
  }

  const to = typeof o.to === "string" ? o.to : typeof o.recipient === "string" ? o.recipient : "";
  const from = typeof o.from === "string" ? o.from : typeof o.sender === "string" ? o.sender : "";
  const subject = typeof o.subject === "string" ? o.subject : "";
  const text = typeof o.text === "string" ? o.text : typeof o.body === "string" ? o.body : "";
  if (to || from) return { to, from, subject, text };
  return null;
}

/**
 * POST /api/inbound/email
 * Webhook for inbound application emails. Identify user by token in "to" address (trackr+TOKEN@...),
 * parse subject/body, store in email_tracking with parsed_result.
 * Accepts Resend-style or generic { to, from, subject, text }.
 */
export async function POST(request: NextRequest) {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        await ensureEmailTrackingSchema(connectionString);
      } catch {
        // Column/index may already exist
      }
    }

    const body = await request.json().catch(() => null);
    const payload = normalizePayload(body);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const token = extractTokenFromTo(payload.to);
    if (!token) {
      return NextResponse.json({ success: true, message: "No token in recipient" }, { status: 200 });
    }

    const [settings] = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.inboundEmailToken, token))
      .limit(1);

    if (!settings) {
      return NextResponse.json({ success: true, message: "Unknown token" }, { status: 200 });
    }

    const data = (body as { data?: { message_id?: string } })?.data;
    const emailId =
      typeof data?.message_id === "string" ? data.message_id : `inbound-${nanoid(16)}-${Date.now()}`;
    const receivedDate = new Date();
    const parsed = parseEmailContent(payload.subject, payload.text);
    const parsedResult: ParsedEmailResult =
      parsed.suggestedAction === "dismiss"
        ? { suggestedAction: "dismiss" }
        : {
            suggestedAction: parsed.suggestedAction,
            suggestedStatus: parsed.suggestedStatus,
            companyName: parsed.companyName,
            jobTitle: parsed.jobTitle,
          };

    try {
      await db.insert(emailTracking).values({
        id: nanoid(),
        userId: settings.userId,
        emailId: String(emailId),
        fromAddress: payload.from,
        subject: payload.subject.slice(0, 1000),
        receivedDate,
        processed: false,
        parsedResult,
      });
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === "23505") return NextResponse.json({ success: true }, { status: 200 });
      throw e;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Inbound email error:", error);
    return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
  }
}
