import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { jdProfileRequestSchema } from "@/lib/validations/ai";
import { jobDescriptionProfileSchema } from "@/lib/validations/resume-os";
import type { JobDescriptionProfile } from "@/lib/resume/model";

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
        {
          success: false,
          error: "JD intelligence is not configured. Add OPENAI_API_KEY.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = jdProfileRequestSchema.safeParse(body);
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

    const { jobDescription } = parsed.data;

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are extracting structured hiring requirements from a software engineering job description.\n` +
            `Return ONLY valid JSON matching this TypeScript type (no markdown):\n` +
            `{\n` +
            `  "title": "string",\n` +
            `  "company": "string | null",\n` +
            `  "seniority": "entry" | "mid" | "senior" | "staff" | "manager",\n` +
            `  "required_skills": string[],\n` +
            `  "preferred_skills": string[],\n` +
            `  "domain_terms": string[],\n` +
            `  "signal_phrases": string[],\n` +
            `  "responsibility_themes": string[],\n` +
            `  "must_have_filters": string[],\n` +
            `  "nice_to_have_filters": string[],\n` +
            `  "title_variants": string[],\n` +
            `  "summary_of_hiring_priorities": string[]\n` +
            `}\n` +
            `Follow these rules:\n` +
            `- Preserve exact phrases from the JD when useful (React, TypeScript, GraphQL, etc.).\n` +
            `- Distinguish must-have vs. nice-to-have requirements when possible.\n` +
            `- Seniority should be inferred from level language (junior, senior, staff, lead, manager).\n` +
            `- responsibility_themes should group repeated themes like ownership, cross-functional work, platform stewardship.\n` +
            `- summary_of_hiring_priorities should be 3–7 short bullet phrases describing what matters most in this role.\n`,
        },
        {
          role: "user",
          content: `Job description:\n\n${jobDescription.slice(0, 8000)}`,
        },
      ],
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    let data: JobDescriptionProfile;
    try {
      const parsedJson = JSON.parse(raw);
      const validated = jobDescriptionProfileSchema.safeParse(parsedJson);
      if (!validated.success) {
        console.error("JD profile validation error", validated.error);
        return NextResponse.json(
          { success: false, error: "AI response failed validation" },
          { status: 502 }
        );
      }
      data = validated.data;
    } catch (err) {
      console.error("JD profile JSON parse error", err);
      return NextResponse.json(
        { success: false, error: "Invalid AI response format" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("JD profile API error:", error);
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { success: false, error: error.message ?? "AI request failed" },
        { status: status >= 400 ? status : 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to build JD profile" },
      { status: 500 }
    );
  }
}

