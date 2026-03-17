import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { resumeAuditRequestSchema } from "@/lib/validations/ai";
import { resumeVersionAuditSchema } from "@/lib/validations/resume-os";
import type { ResumeVersionAudit } from "@/lib/resume/model";

/**
 * POST /api/ai/resume-audit
 *
 * Runs a holistic audit on a resume using the rubric from the Operating Manual:
 * - ATS Safety
 * - JD Alignment
 * - Experience Quality
 * - Human Quality
 * - Interview Defensibility
 *
 * NOTE: v1 operates on plain text (resumeText) plus optional JD profile summary.
 * The caller is responsible for generating a clean, ATS-safe text version of
 * the chosen resume variant (e.g. from sections or export helpers).
 */
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
          error: "Resume audit is not configured. Add OPENAI_API_KEY.",
        },
        { status: 503 }
      );
    }

    const json = await request.json();
    const parsed = resumeAuditRequestSchema.safeParse(json);
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

    const { jdProfile, resumeText } = parsed.data;

    const openai = new OpenAI({ apiKey });

    const jdSummary = jdProfile
      ? [
          jdProfile.title,
          jdProfile.company,
          `Seniority: ${jdProfile.seniority}`,
          jdProfile.required_skills?.length
            ? `Required skills: ${jdProfile.required_skills.join(", ")}`
            : undefined,
          jdProfile.domain_terms?.length
            ? `Domain: ${jdProfile.domain_terms.join(", ")}`
            : undefined,
          jdProfile.summary_of_hiring_priorities?.length
            ? `Hiring priorities: ${jdProfile.summary_of_hiring_priorities.join(
                "; "
              )}`
            : undefined,
        ]
          .filter(Boolean)
          .join("\n")
      : "No specific job description provided.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are auditing a software engineer's resume using this rubric:\n` +
            `- ATS Safety (0-20): single-column, standard headings, parse-safe structure, no risky formatting.\n` +
            `- JD Alignment (0-20): title/level match, hard-skill match, domain match, coverage of must-have JD signals.\n` +
            `- Experience Quality (0-25): accomplishment focus, clear action/context/result, outcome evidence, role progression, ownership signals.\n` +
            `- Human Quality (0-20): natural phrasing, low buzzword density, varied syntax, believable specificity, controlled metric density.\n` +
            `- Interview Defensibility (0-15): claims are explainable, metrics plausible, contribution clear.\n\n` +
            `Return ONLY valid JSON matching this type (no markdown):\n` +
            `{\n` +
            `  "atsSafety": number,\n` +
            `  "jdAlignment": number,\n` +
            `  "experienceQuality": number,\n` +
            `  "humanQuality": number,\n` +
            `  "defensibility": number,\n` +
            `  "total": number,\n` +
            `  "riskFlags": string[]\n` +
            `}\n` +
            `Numbers should roughly follow the scoring bands in the rubric. riskFlags should be short phrases like "keyword stuffing", "weak recent-role evidence", or "ATS formatting risk".`,
        },
        {
          role: "user",
          content:
            `Job profile (if any):\n${jdSummary}\n\n` +
            `----\n\n` +
            `Resume text (ATS-safe plain text, in reading order):\n${resumeText}`,
        },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { success: false, error: "No response from AI" },
        { status: 502 }
      );
    }

    let audit: ResumeVersionAudit;
    try {
      const parsedJson = JSON.parse(raw);
      const validated = resumeVersionAuditSchema.safeParse(parsedJson);
      if (!validated.success) {
        console.error("Resume audit validation error", validated.error);
        return NextResponse.json(
          { success: false, error: "AI response failed validation" },
          { status: 502 }
        );
      }
      audit = validated.data;
    } catch (err) {
      console.error("Resume audit JSON parse error", err);
      return NextResponse.json(
        { success: false, error: "Invalid AI response format" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    console.error("Resume audit API error:", error);
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { success: false, error: error.message ?? "AI request failed" },
        { status: status >= 400 ? status : 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to audit resume" },
      { status: 500 }
    );
  }
}

