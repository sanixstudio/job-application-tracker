import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { careerProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { optimizeCareerProfileSectionSchema } from "@/lib/validations/career-profile";
import type { CareerProfile, CareerProfileSections } from "@/types";

const SECTION_LABELS: Record<string, string> = {
  headline: "LinkedIn headline",
  summary: "LinkedIn About/summary",
  bio: "GitHub profile bio",
};

/**
 * POST /api/career-profiles/[id]/optimize
 * Generate an AI-optimized version of one section (headline, summary, or bio).
 * Saves the optimized text and generatedAt in the profile sections; returns the optimized text.
 */
export async function POST(
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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Optimization is not configured. Add OPENAI_API_KEY." },
        { status: 503 }
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

    const body = await request.json();
    const parsed = optimizeCareerProfileSectionSchema.safeParse(body);
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

    const { section, currentContent } = parsed.data;
    const sections = (profile.sections ?? {}) as CareerProfileSections;
    const sectionData = sections[section as keyof CareerProfileSections];
    const textToOptimize =
      currentContent?.trim() ?? sectionData?.current?.trim() ?? "";

    if (!textToOptimize) {
      return NextResponse.json(
        {
          success: false,
          error: `Add or paste your current ${SECTION_LABELS[section] ?? section} below, then click Optimize.`,
        },
        { status: 400 }
      );
    }

    const label = SECTION_LABELS[section] ?? section;
    const isShort = section === "headline" || section === "bio";
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a career coach. Improve the following ${label} for job seekers. Keep the same tone (professional, concise). 
${isShort ? "Return only the improved text, no preamble (max 1-2 sentences for headline, 1 short paragraph for bio)." : "Return only the improved About/summary text, 2-4 short paragraphs, no preamble or labels."}`,
        },
        {
          role: "user",
          content: `Current ${label}:\n\n${textToOptimize.slice(0, 4000)}`,
        },
      ],
      max_tokens: isShort ? 150 : 500,
    });

    const optimized = completion.choices[0]?.message?.content?.trim();
    if (!optimized) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    const updatedSections: CareerProfileSections = { ...sections };
    const key = section as keyof CareerProfileSections;
    updatedSections[key] = {
      ...sectionData,
      current: sectionData?.current ?? textToOptimize,
      optimized,
      generatedAt: new Date().toISOString(),
    };

    const [updated] = await db
      .update(careerProfiles)
      .set({
        sections: updatedSections,
        updatedAt: new Date(),
      })
      .where(eq(careerProfiles.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        optimized,
        generatedAt: updatedSections[key]?.generatedAt,
        profile: updated as CareerProfile,
      },
    });
  } catch (error) {
    console.error("Career profile optimize error:", error);
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { success: false, error: error.message ?? "AI request failed" },
        { status: status >= 400 ? status : 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to optimize" },
      { status: 500 }
    );
  }
}
