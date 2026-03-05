import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applications, emailTracking } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const applySchema = z.object({
  action: z.enum(["add", "update", "dismiss"]),
  applicationId: z.string().optional(),
  status: z
    .enum(["applied", "interview_1", "interview_2", "interview_3", "offer", "rejected", "withdrawn"])
    .optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * POST /api/email-suggestions/[id]/apply
 * Apply an email suggestion: add as new application, update existing application status, or dismiss.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }

    const [row] = await db
      .select()
      .from(emailTracking)
      .where(and(eq(emailTracking.id, id), eq(emailTracking.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ success: false, error: "Suggestion not found" }, { status: 404 });
    }

    const { action, applicationId, status, jobTitle, companyName, jobUrl } = parsed.data;

    if (action === "dismiss") {
      await db
        .update(emailTracking)
        .set({ processed: true })
        .where(eq(emailTracking.id, id));
      return NextResponse.json({ success: true });
    }

    const pr = row.parsedResult;
    const company = companyName ?? pr?.companyName ?? "Unknown";
    const title = jobTitle ?? pr?.jobTitle ?? "Application";
    const url = jobUrl && jobUrl !== "" ? jobUrl : "https://example.com";

    if (action === "add") {
      const appId = nanoid();
      const now = new Date();
      await db.insert(applications).values({
        id: appId,
        userId,
        jobTitle: title,
        companyName: company,
        jobUrl: url,
        status: "applied",
        source: "email",
        emailId: row.emailId,
        appliedDate: now,
        createdAt: now,
        updatedAt: now,
      });
      await db
        .update(emailTracking)
        .set({ processed: true })
        .where(eq(emailTracking.id, id));
      return NextResponse.json({ success: true, data: { applicationId: appId } });
    }

    if (action === "update") {
      if (!applicationId || !status) {
        return NextResponse.json(
          { success: false, error: "applicationId and status required for update" },
          { status: 400 }
        );
      }
      const [app] = await db
        .select()
        .from(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
        .limit(1);
      if (!app) {
        return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
      }
      await db
        .update(applications)
        .set({
          status,
          updatedAt: new Date(),
          ...(app.emailId ? {} : { emailId: row.emailId }),
        })
        .where(eq(applications.id, applicationId));
      await db
        .update(emailTracking)
        .set({ processed: true })
        .where(eq(emailTracking.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Email suggestion apply error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to apply" },
      { status: 500 }
    );
  }
}
