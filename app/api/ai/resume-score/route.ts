import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resumeScoreRequestSchema } from "@/lib/validations/ai";
import { scoreResumeAgainstJob } from "@/lib/resume-score";
import type { ResumeContent } from "@/types";
import type { ResumeVersion } from "@/lib/resume/model";

/**
 * POST /api/ai/resume-score
 * Scores a canonical resume version against a JD using existing scoring logic.
 *
 * This v1 implementation expects the caller to send:
 * - profile: CandidateProfile (currently unused, but reserved for future fact-level scoring)
 * - jdProfile: JobDescriptionProfile
 * - content: existing ResumeContent for compatibility with scoreResumeAgainstJob
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

    const body = await request.json();
    const parsed = resumeScoreRequestSchema
      .extend({
        content: ({} as any) as unknown as import("zod").ZodType<ResumeContent>,
      })
      .safeParse(body);

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

    const { jdProfile, content } = parsed.data as {
      jdProfile: { required_skills: string[]; title: string };
      content: ResumeContent;
    };

    const jdText = [
      jdProfile.title,
      ...(jdProfile.required_skills ?? []),
    ].join("\n");

    const scored = scoreResumeAgainstJob(content, jdText);

    return NextResponse.json({
      success: true,
      data: scored,
    });
  } catch (error) {
    console.error("Resume score API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to score resume" },
      { status: 500 }
    );
  }
}

