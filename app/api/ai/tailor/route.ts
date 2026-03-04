import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { resumes, tailorHistory } from "@/lib/db/schema";
import { eq, and, desc, notInArray } from "drizzle-orm";
import type { ResumeContent } from "@/types";

/** Build a short plain-text version of resume for the prompt. */
function resumeToPromptText(content: ResumeContent): string {
  const parts: string[] = [];
  const sections = content?.sections ?? [];
  for (const s of sections) {
    parts.push(s.heading);
    if (s.body) parts.push(s.body);
    if (s.items?.length) {
      for (const item of s.items) {
        const line = Object.entries(item)
          .filter(([, v]) => v != null && String(v).trim() !== "")
          .map(([, v]) => String(v))
          .join(" · ");
        if (line) parts.push(line);
      }
    }
  }
  return parts.join("\n\n") || "(No content yet)";
}

/** Expected shape of AI response. */
export interface TailorResult {
  tailoredSummary?: string;
  keywords?: string[];
  bulletSuggestions?: string[];
}

export async function POST(request: NextRequest) {
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
        { success: false, error: "Tailoring is not configured. Add OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    if (!jobDescription) {
      return NextResponse.json(
        { success: false, error: "Job description is required" },
        { status: 400 }
      );
    }

    let resumeContent: ResumeContent;
    if (body.resumeContent && typeof body.resumeContent === "object") {
      resumeContent = body.resumeContent as ResumeContent;
    } else {
      const [resume] = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .limit(1);
      if (!resume) {
        return NextResponse.json(
          { success: false, error: "Create a resume first" },
          { status: 400 }
        );
      }
      resumeContent = resume.content as ResumeContent;
    }

    const resumeText = resumeToPromptText(resumeContent);

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a resume coach. Given a candidate's resume and a job description, suggest how to tailor the resume. Respond only with valid JSON in this exact shape (no markdown, no code block):
{ "tailoredSummary": "2-3 sentence professional summary tailored to the job", "keywords": ["keyword1", "keyword2", ...], "bulletSuggestions": ["Optional bullet point suggestion 1", "Optional bullet point suggestion 2"] }
Keep tailoredSummary under 150 words. Include 5-10 keywords from the job that the candidate should weave in. bulletSuggestions can be 0-3 bullets.`,
        },
        {
          role: "user",
          content: `Job description:\n\n${jobDescription.slice(0, 6000)}\n\n---\n\nCandidate resume:\n\n${resumeText.slice(0, 4000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    let data: TailorResult;
    try {
      data = JSON.parse(raw) as TailorResult;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid AI response format" },
        { status: 502 }
      );
    }

    try {
      const preview = jobDescription.slice(0, 500);
      const id = nanoid();
      await db.insert(tailorHistory).values({
        id,
        userId,
        jobDescriptionPreview: preview,
        result: data as unknown as Record<string, unknown>,
      });

      const recent = await db
        .select({ id: tailorHistory.id })
        .from(tailorHistory)
        .where(eq(tailorHistory.userId, userId))
        .orderBy(desc(tailorHistory.createdAt))
        .limit(5);
      const keptIds = recent.map((r) => r.id);
      if (keptIds.length > 0) {
        await db
          .delete(tailorHistory)
          .where(
            and(eq(tailorHistory.userId, userId), notInArray(tailorHistory.id, keptIds))
          );
      }
    } catch (historyError) {
      console.warn("Tailor history save failed (table may not exist yet). Run: npm run db:migrate", historyError);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Tailor API error:", error);
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { success: false, error: error.message ?? "AI request failed" },
        { status: status >= 400 ? status : 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
