import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createJobSchema } from "@/lib/validations/job";

const EXT_API_HEADER = "x-trackr-api-key";

/**
 * POST /api/ext/save
 * Save a job from the Chrome extension. Auth via X-Trackr-API-Key header.
 * Body: same as POST /api/jobs (jobTitle, companyName, jobUrl, etc.).
 * CORS: allowed for extension origins (handled by response headers).
 */
export async function POST(request: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Trackr-API-Key",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    const apiKey = request.headers.get(EXT_API_HEADER)?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing X-Trackr-API-Key header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const [settings] = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.extensionApiKey, apiKey))
      .limit(1);

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired API key. Generate a new key in Trackr dashboard." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { success: false, error: message },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = parsed.data;
    const id = nanoid();
    const now = new Date();

    const [newJob] = await db
      .insert(applications)
      .values({
        id,
        userId: settings.userId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        jobUrl: data.jobUrl,
        applicationUrl: data.applicationUrl || undefined,
        status: data.status ?? "applied",
        source: "extension",
        notes: data.notes,
        salaryRange: data.salaryRange,
        location: data.location,
        appliedDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newJob },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Extension save error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save job" },
      { status: 500, headers: corsHeaders }
    );
  }
}
