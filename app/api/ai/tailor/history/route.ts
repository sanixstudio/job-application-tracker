import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tailorHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { TailorResult } from "../../tailor/route";

export interface TailorHistoryEntry {
  id: string;
  jobDescriptionPreview: string;
  result: TailorResult;
  createdAt: string;
}

/**
 * GET /api/ai/tailor/history
 * Returns the last 5 tailor responses for the signed-in user (newest first).
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
      .select()
      .from(tailorHistory)
      .where(eq(tailorHistory.userId, userId))
      .orderBy(desc(tailorHistory.createdAt))
      .limit(5);

    const data: TailorHistoryEntry[] = rows.map((r) => ({
      id: r.id,
      jobDescriptionPreview: r.jobDescriptionPreview,
      result: r.result as TailorResult,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.warn("Tailor history load failed (table may not exist). Run: npm run db:migrate", error);
    return NextResponse.json({ success: true, data: [] });
  }
}
