import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeAnalytics } from "@/lib/analytics";

/**
 * GET /api/analytics
 * Returns funnel counts, response rate, and stale (no response 14+ days) count for the current user.
 * Auth: Clerk. Used by dashboard (data is also computed server-side in the page).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rows = await db
      .select({
        status: applications.status,
        appliedDate: applications.appliedDate,
        followUpAt: applications.followUpAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId));

    const analytics = computeAnalytics(
      rows.map((r) => ({
        status: r.status,
        appliedDate: r.appliedDate,
        followUpAt: r.followUpAt ?? undefined,
      }))
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
