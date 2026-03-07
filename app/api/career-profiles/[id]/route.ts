import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { careerProfiles, userSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateCareerProfileSchema } from "@/lib/validations/career-profile";
import type { CareerProfile, CareerProfileSections } from "@/types";

/**
 * GET /api/career-profiles/[id]
 * Get a single career profile (must belong to current user).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const [profile] = await db
      .select()
      .from(careerProfiles)
      .where(and(eq(careerProfiles.id, id), eq(careerProfiles.userId, userId)))
      .limit(1);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: profile as CareerProfile });
  } catch (error) {
    console.error("Career profile GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/career-profiles/[id]
 * Update profile URL and/or section current content (headline, summary, bio).
 * Also syncs profileUrl to user_settings for checklist.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const [existing] = await db
      .select()
      .from(careerProfiles)
      .where(and(eq(careerProfiles.id, id), eq(careerProfiles.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateCareerProfileSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { success: false, error: message || "Validation failed" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const now = new Date();
    const sections: CareerProfileSections = { ...(existing.sections as CareerProfileSections) };

    if (input.headline !== undefined) {
      sections.headline = {
        ...sections.headline,
        current: input.headline.trim() || undefined,
      };
    }
    if (input.summary !== undefined) {
      sections.summary = {
        ...sections.summary,
        current: input.summary.trim() || undefined,
      };
    }
    if (input.bio !== undefined) {
      sections.bio = {
        ...sections.bio,
        current: input.bio.trim() || undefined,
      };
    }

    const updates: {
      profileUrl?: string | null;
      sections: CareerProfileSections;
      updatedAt: Date;
    } = { sections, updatedAt: now };
    if (input.profileUrl !== undefined) updates.profileUrl = input.profileUrl;

    const [updated] = await db
      .update(careerProfiles)
      .set(updates)
      .where(eq(careerProfiles.id, id))
      .returning();

    // Sync URL to user_settings for profile checklist
    if (input.profileUrl !== undefined) {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      const url = input.profileUrl?.trim() || null;
      if (existing.platform === "linkedin") {
        if (settings) {
          await db
            .update(userSettings)
            .set({ linkedinUrl: url, updatedAt: now })
            .where(eq(userSettings.userId, userId));
        } else {
          await db.insert(userSettings).values({
            userId,
            linkedinUrl: url,
            updatedAt: now,
          });
        }
      } else if (existing.platform === "github") {
        if (settings) {
          await db
            .update(userSettings)
            .set({ githubUrl: url, updatedAt: now })
            .where(eq(userSettings.userId, userId));
        } else {
          await db.insert(userSettings).values({
            userId,
            githubUrl: url,
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data: updated as CareerProfile });
  } catch (error) {
    console.error("Career profile PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
