import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const EXT_API_HEADER = "x-trackr-api-key";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "X-Trackr-API-Key",
} as const;

/**
 * GET /api/ext/me
 * Verify extension API key. Returns 200 if valid, 401 otherwise.
 * Used by the Chrome extension to check sign-in state without saving a job.
 */
export async function GET(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const apiKey = request.headers.get(EXT_API_HEADER)?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing X-Trackr-API-Key header" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const [row] = await db
      .select({ userId: userSettings.userId })
      .from(userSettings)
      .where(eq(userSettings.extensionApiKey, apiKey))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired API key. Sign in again in Trackr.",
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Extension me check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
