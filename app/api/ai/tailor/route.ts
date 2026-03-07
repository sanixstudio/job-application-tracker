import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { tailorRequestSchema } from "@/lib/validations/ai";
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
  suggestedSkills?: string[];
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
    const parsed = tailorRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { success: false, error: message || "Invalid request" },
        { status: 400 }
      );
    }

    const { jobDescription, resumeContent: bodyResume } = parsed.data;

    let resumeContent: ResumeContent;
    if (bodyResume && typeof bodyResume === "object" && Object.keys(bodyResume).length > 0) {
      resumeContent = bodyResume as ResumeContent;
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
{ "tailoredSummary": "2-3 sentence professional summary tailored to the job", "keywords": ["keyword1", "keyword2", ...], "bulletSuggestions": ["Optional bullet point suggestion 1", "Optional bullet point suggestion 2"], "suggestedSkills": ["Skill1", "Skill2", ...] }
Keep tailoredSummary under 150 words. Include 5-10 keywords from the job. bulletSuggestions: 0-3 achievement-style bullets. suggestedSkills: 5-12 technical or soft skills from the job to list in a Skills section.`,
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
