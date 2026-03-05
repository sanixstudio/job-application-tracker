import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  applications,
  resumes,
  userSettings,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  updateProfileChecklistSchema,
  type UpdateProfileChecklistInput,
} from "@/lib/validations/profile";

const TOTAL_ITEMS = 4;

export type ProfileChecklistResponse = {
  hasResume: boolean;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  hasFirstApplication: boolean;
  completedCount: number;
  totalCount: number;
  score: number;
  linkedinUrl: string | null;
  githubUrl: string | null;
};

/** Build checklist state for a user. Used by GET and after PATCH. */
async function getChecklistData(
  userId: string
): Promise<ProfileChecklistResponse> {
  const [resumeRows, appRows, settings] = await Promise.all([
    db.select({ id: resumes.id }).from(resumes).where(eq(resumes.userId, userId)),
    db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({
        linkedinUrl: userSettings.linkedinUrl,
        githubUrl: userSettings.githubUrl,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1),
  ]);

  const hasResume = resumeRows.length >= 1;
  const hasFirstApplication = appRows.length >= 1;
  const s = settings?.[0];
  const hasLinkedIn = Boolean(s?.linkedinUrl?.trim());
  const hasGitHub = Boolean(s?.githubUrl?.trim());

  const completedCount = [
    hasResume,
    hasLinkedIn,
    hasGitHub,
    hasFirstApplication,
  ].filter(Boolean).length;
  const score = Math.round((100 * completedCount) / TOTAL_ITEMS);

  return {
    hasResume,
    hasLinkedIn,
    hasGitHub,
    hasFirstApplication,
    completedCount,
    totalCount: TOTAL_ITEMS,
    score,
    linkedinUrl: s?.linkedinUrl ?? null,
    githubUrl: s?.githubUrl ?? null,
  };
}

/**
 * GET /api/profile/checklist
 * Returns job-ready checklist state and score for the current user.
 * Auth: Clerk.
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
    const data = await getChecklistData(userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Profile checklist GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load checklist" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/checklist
 * Update LinkedIn/GitHub URLs. Body: { linkedinUrl?: string | null, githubUrl?: string | null }.
 * Auth: Clerk.
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = updateProfileChecklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input: UpdateProfileChecklistInput = parsed.data;
    const updates: { linkedinUrl?: string | null; githubUrl?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (input.linkedinUrl !== undefined) updates.linkedinUrl = input.linkedinUrl;
    if (input.githubUrl !== undefined) updates.githubUrl = input.githubUrl;

    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userSettings)
        .set(updates)
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        linkedinUrl: updates.linkedinUrl ?? null,
        githubUrl: updates.githubUrl ?? null,
        updatedAt: updates.updatedAt,
      });
    }

    const data = await getChecklistData(userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Profile checklist PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
