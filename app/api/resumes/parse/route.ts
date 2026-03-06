import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { extractTextFromResumeFile, isSupportedResumeMimeType } from "@/lib/resume-extract-text";
import { scoreResume } from "@/lib/resume-score";
import type { ResumeContent, ResumeSection } from "@/types";
import { nanoid } from "nanoid";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/resumes/parse
 * Upload a resume file (PDF or DOCX). Extracts text, parses into structured sections via AI, and returns content + score.
 * Auth: Clerk.
 * Body: multipart/form-data with field "file".
 */
export async function POST(request: Request) {
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
        { success: false, error: "Resume parsing is not configured. Add OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Use form field 'file' with a PDF or DOCX." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    if (!isSupportedResumeMimeType(file.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Use PDF or DOCX." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = await extractTextFromResumeFile(buffer, file.type);
    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract enough text from the file. Ensure it's a valid PDF or DOCX with selectable text." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Given raw text extracted from a document, output structured JSON (no markdown, no code fence) with two top-level keys:

1. "is_resume" (boolean): true only if the document is clearly a professional resume/CV (career history, skills, education, work experience). Set false for articles, recipes, fiction, lists, or any non-resume content—even if you can force it into sections.

2. "sections": array of parsed sections. Use this shape:
[
  { "id": "unique-id-1", "type": "summary", "heading": "Summary", "body": "..." },
  { "id": "unique-id-2", "type": "skills", "heading": "Skills", "body": "..." },
  { "id": "unique-id-3", "type": "experience", "heading": "Experience", "items": [{ "company": "", "title": "", "dates": "", "description": "..." }] },
  { "id": "unique-id-4", "type": "education", "heading": "Education", "items": [{ "school": "", "degree": "", "field": "", "dates": "" }] }
]
- type must be one of: summary, skills, experience, education, projects.
- experience items: company, title, dates, description. education items: school, degree, field, dates.
- Omit a section if there is no content for it. Preserve the author's wording; only structure. Use short UUID-like ids (e.g. "a1b2c3d4").`,
        },
        {
          role: "user",
          content: `Extract and structure this document. Include "is_resume" and "sections" in your JSON.\n\n${rawText.slice(0, 12000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "Parsing failed. No response from AI." },
        { status: 502 }
      );
    }

    let parsed: {
      sections?: Array<{ id?: string; type?: string; heading?: string; body?: string; items?: Array<Record<string, string>> }>;
      is_resume?: boolean;
    };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return NextResponse.json(
        { success: false, error: "Parsing failed. Invalid structure." },
        { status: 502 }
      );
    }

    const isLikelyResumeFromAI = typeof parsed.is_resume === "boolean" ? parsed.is_resume : undefined;

    const sections: ResumeSection[] = (parsed.sections ?? [])
      .filter((s) => s.type && ["summary", "skills", "experience", "education", "projects"].includes(s.type))
      .map((s) => ({
        id: typeof s.id === "string" && s.id ? s.id : nanoid(10),
        type: s.type as ResumeSection["type"],
        heading: typeof s.heading === "string" && s.heading ? s.heading : (s.type === "summary" ? "Summary" : s.type === "skills" ? "Skills" : s.type === "experience" ? "Experience" : s.type === "education" ? "Education" : "Projects"),
        body: typeof s.body === "string" ? s.body : undefined,
        items: Array.isArray(s.items) ? s.items.filter((i) => typeof i === "object" && i !== null) as Array<Record<string, string>> : undefined,
      }));

    const content: ResumeContent = { sections };
    const { score, feedback } = scoreResume(content, { isLikelyResume: isLikelyResumeFromAI });

    return NextResponse.json({
      success: true,
      data: {
        content,
        score,
        feedback,
      },
    });
  } catch (error) {
    console.error("Resume parse API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
