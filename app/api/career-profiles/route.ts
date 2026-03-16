import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { careerProfiles, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CareerProfile } from "@/types";

/**
 * GET /api/career-profiles
 * List career profiles (LinkedIn, GitHub) for the current user.
 * If user has linkedinUrl/githubUrl in user_settings but no career_profiles rows, we create them so data is not lost.
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

    let profiles = await db
      .select()
      .from(careerProfiles)
      .where(eq(careerProfiles.userId, userId));

    // Seed from user_settings if they have URLs but no career_profiles yet
    const [settings] = await db
      .select({
        linkedinUrl: userSettings.linkedinUrl,
        githubUrl: userSettings.githubUrl,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const hasLinkedIn = profiles.some((p) => p.platform === "linkedin");
    const hasGitHub = profiles.some((p) => p.platform === "github");
    const now = new Date();

    if (!hasLinkedIn && settings?.linkedinUrl?.trim()) {
      const [inserted] = await db
        .insert(careerProfiles)
        .values({
          id: nanoid(),
          userId,
          platform: "linkedin",
          profileUrl: settings.linkedinUrl.trim(),
          sections: {},
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted) profiles = [...profiles, inserted];
    }
    if (!hasGitHub && settings?.githubUrl?.trim()) {
      const [inserted] = await db
        .insert(careerProfiles)
        .values({
          id: nanoid(),
          userId,
          platform: "github",
          profileUrl: settings.githubUrl.trim(),
          sections: {},
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted) profiles = [...profiles, inserted];
    }

    // Ensure we always return at most one per platform (linkedin, github)
    const byPlatform = new Map(profiles.map((p) => [p.platform, p]));
    const linkedin = byPlatform.get("linkedin");
    const github = byPlatform.get("github");
    const result: CareerProfile[] = [];
    if (linkedin) result.push(linkedin as CareerProfile);
    if (github) result.push(github as CareerProfile);

    // Ensure both platforms have a row so the UI always shows LinkedIn and GitHub cards
    if (!linkedin) {
      const [inserted] = await db
        .insert(careerProfiles)
        .values({
          id: nanoid(),
          userId,
          platform: "linkedin",
          profileUrl: null,
          sections: {},
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted) result.push(inserted as CareerProfile);
    }
    if (!github) {
      const [inserted] = await db
        .insert(careerProfiles)
        .values({
          id: nanoid(),
          userId,
          platform: "github",
          profileUrl: null,
          sections: {},
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted) result.push(inserted as CareerProfile);
    }

    result.sort((a, b) => (a.platform === "linkedin" && b.platform === "github" ? -1 : 1));
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Career profiles GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load career profiles" },
      { status: 500 }
    );
  }
}
