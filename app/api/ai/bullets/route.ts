import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { bulletsRequestSchema } from "@/lib/validations/ai";
import { resumeBulletSchema } from "@/lib/validations/resume-os";
import type { ResumeBullet } from "@/lib/resume/model";

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
          error: "Bullet generation is not configured. Add OPENAI_API_KEY.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = bulletsRequestSchema.safeParse(body);
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

    const { mode, jdProfile, facts, existingBullets } = parsed.data;

    const openai = new OpenAI({ apiKey });

    const jdSummaryParts = [
      jdProfile.title,
      jdProfile.company,
      ...(jdProfile.required_skills ?? []),
      ...(jdProfile.preferred_skills ?? []),
      ...(jdProfile.domain_terms ?? []),
      ...(jdProfile.signal_phrases ?? []),
      ...(jdProfile.responsibility_themes ?? []),
      ...(jdProfile.summary_of_hiring_priorities ?? []),
    ]
      .filter(Boolean)
      .join("\n");

    const factsText = facts
      .map((f) => {
        const metric = f.metric ? ` Metric: ${f.metric.name} = ${f.metric.value}.` : "";
        const skills =
          f.skills_used && f.skills_used.length
            ? ` Skills: ${f.skills_used.join(", ")}.`
            : "";
        return `- Action: ${f.action}\n  Context: ${f.context}\n  ProblemOrGoal: ${
          f.problem_or_goal || "n/a"
        }\n  Result: ${f.result || "n/a"}${metric}${skills}`;
      })
      .join("\n\n");

    const existingBulletsText =
      mode === "humanize" && existingBullets.length
        ? existingBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")
        : "";

    const systemContent =
      mode === "generate"
        ? `You are a resume bullet writer following a strict operating manual.
Write accomplishment-focused bullets for a software engineer's resume.
Rules:
- Use Action + Context/Scope + Result.
- Keep bullets concise (usually 1–2 lines) and ATS-safe.
- Use plain, specific language; avoid generic AI tone or buzzwords.
- Use believable metrics only when implied by the facts.
- Each bullet should be interview-defensible.
Return ONLY valid JSON: { "bullets": [{ "id": "string", "text": "string", "bullet_type": "accomplishment" | "improvement" | "ownership" | "leadership" | "technical_depth" | "domain" }] }`
        : `You are rewriting existing resume bullets to sound more natural and credible.
Rules:
- Preserve exact tools, domains, and measurable outcomes.
- Reduce buzzwords and repeated openings.
- Use Action + Context + Result where possible.
- Keep ATS-safe and interview-defensible.
Return ONLY valid JSON: { "bullets": [{ "id": "string", "text": "string" }] }`;

    const userContent =
      mode === "generate"
        ? `Target job profile:\n${jdSummaryParts}\n\nEvidence facts:\n${factsText}\n\nGenerate 3–8 bullets that best support this job.`
        : `Target job profile:\n${jdSummaryParts}\n\nExisting bullets:\n${existingBulletsText}\n\nRewrite these bullets to follow the rules. Keep the same number of bullets.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: userContent,
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

    let bullets: ResumeBullet[];
    try {
      const parsedJson = JSON.parse(raw) as { bullets?: Array<{ id?: string; text?: string; bullet_type?: string }> };
      const list = parsedJson.bullets ?? [];
      const validated = list.map((b, idx) => {
        const candidate = {
          id: b.id && b.id.length ? b.id : `b${idx + 1}`,
          text: b.text ?? "",
          bullet_type: b.bullet_type as ResumeBullet["bullet_type"] | undefined,
        };
        const result = resumeBulletSchema.safeParse(candidate);
        if (!result.success) {
          throw result.error;
        }
        return result.data;
      });
      bullets = validated;
    } catch (err) {
      console.error("Bullets API validation error", err);
      return NextResponse.json(
        { success: false, error: "AI response failed validation" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bullets,
    });
  } catch (error) {
    console.error("Bullets API error:", error);
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { success: false, error: error.message ?? "AI request failed" },
        { status: status >= 400 ? status : 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to generate bullets" },
      { status: 500 }
    );
  }
}

