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
          content: `You are a resume parser. Given raw text extracted from a resume, output structured JSON that matches this TypeScript shape exactly (no markdown, no code fence):
{
  "sections": [
    { "id": "unique-id-1", "type": "summary", "heading": "Summary", "body": "2-4 sentence professional summary" },
    { "id": "unique-id-2", "type": "skills", "heading": "Skills", "body": "comma or newline separated skills" },
    { "id": "unique-id-3", "type": "experience", "heading": "Experience", "items": [{ "company": "", "title": "", "dates": "", "description": "bullet points, one per line" }] },
    { "id": "unique-id-4", "type": "education", "heading": "Education", "items": [{ "school": "", "degree": "", "field": "", "dates": "" }] }
  ]
}
Rules:
- type must be one of: summary, skills, experience, education, projects.
- Use "summary" for professional summary / objective. Use "skills" for technical and soft skills.
- experience items must have: company, title, dates, description (description can have multiple bullet points separated by newlines).
- education items must have: school, degree, field, dates (field can be empty).
- Omit a section entirely if the resume has no content for it.
- Preserve the candidate's wording; only structure and normalize. Generate a short UUID-like id for each section (e.g. "a1b2c3d4").`,
        },
        {
          role: "user",
          content: `Extract and structure this resume text into the JSON format:\n\n${rawText.slice(0, 12000)}`,
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

    let parsed: { sections?: Array<{ id?: string; type?: string; heading?: string; body?: string; items?: Array<Record<string, string>> }> };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return NextResponse.json(
        { success: false, error: "Parsing failed. Invalid structure." },
        { status: 502 }
      );
    }

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
    const { score, feedback } = scoreResume(content);

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
