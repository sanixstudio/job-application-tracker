import type { ResumeContent } from "@/types";

/** Resume score result: 0-100 and actionable feedback. */
export interface ResumeScoreResult {
  score: number;
  feedback: string[];
}

/** Strong action verbs often used in STAR-style bullets. */
const ACTION_VERBS = new Set(
  [
    "achieved", "built", "created", "delivered", "designed", "developed",
    "drove", "established", "improved", "increased", "implemented", "led",
    "managed", "optimized", "reduced", "scaled", "spearheaded", "transformed",
  ].map((v) => v.toLowerCase())
);

/** Regex for quantifiable metrics: numbers, %, $, "x%", "N users", etc. */
const METRIC_PATTERN = /\d+%|\$\d|%\s*(increase|reduction|growth)|(\d+x\s*)|(reduced|increased|improved)\s+by\s+\d+/i;
const NUMBER_PATTERN = /\d+/;

/**
 * Scores a resume (0-100) based on best-practice criteria and returns feedback.
 * Criteria: section completeness, STAR-style bullets, quantifiable metrics, clarity.
 */
export function scoreResume(content: ResumeContent): ResumeScoreResult {
  const feedback: string[] = [];
  const sections = content?.sections ?? [];
  let score = 0;
  const maxSection = 25;
  const maxBullets = 35;
  const maxMetrics = 25;
  const maxClarity = 15;

  // 1. Section completeness (summary, skills, experience; education optional)
  const hasSummary = sections.some(
    (s) => s.type === "summary" && (s.body?.trim() ?? "").length > 20
  );
  const hasSkills = sections.some(
    (s) => s.type === "skills" && (s.body?.trim() ?? "").length > 5
  );
  const hasExperience = sections.some(
    (s) => s.type === "experience" && (s.items?.length ?? 0) > 0
  );
  const sectionCount = [hasSummary, hasSkills, hasExperience].filter(Boolean).length;
  score += Math.round((sectionCount / 3) * maxSection);
  if (!hasSummary) feedback.push("Add a professional summary (2–4 sentences).");
  if (!hasSkills) feedback.push("Add a Skills section with relevant technologies and tools.");
  if (!hasExperience) feedback.push("Add at least one experience entry with bullet points.");

  // 2. STAR-style / impact bullets (action verb + result)
  let bulletsWithImpact = 0;
  let totalBullets = 0;
  for (const section of sections) {
    if (section.type !== "experience" || !section.items?.length) continue;
    for (const item of section.items) {
      const desc = (item.description ?? item.bullets ?? "").trim();
      if (!desc) continue;
      const lines = desc.split(/\r?\n/).filter((l) => l.trim().length > 0);
      for (const line of lines) {
        totalBullets++;
        const firstWord = line.trim().split(/\s+/)[0]?.toLowerCase().replace(/^[•\-*]\s*/, "") ?? "";
        const hasActionVerb = ACTION_VERBS.has(firstWord) || firstWord.endsWith("ed");
        const hasResult = line.length > 30 && (METRIC_PATTERN.test(line) || NUMBER_PATTERN.test(line));
        if (hasActionVerb && (hasResult || line.length > 50)) bulletsWithImpact++;
      }
    }
  }
  const bulletRatio = totalBullets > 0 ? bulletsWithImpact / totalBullets : 0;
  score += Math.round(bulletRatio * maxBullets);
  if (totalBullets > 0 && bulletRatio < 0.5) {
    feedback.push(
      "Use STAR-style bullets: start with action verbs (e.g. Led, Improved, Delivered) and include results or metrics where possible."
    );
  }

  // 3. Quantifiable metrics in experience
  let bulletsWithMetrics = 0;
  for (const section of sections) {
    if (section.type !== "experience" && section.type !== "projects") continue;
    const body = section.body ?? "";
    const items = section.items ?? [];
    const fullText = body + " " + items.map((i) => i.description ?? i.bullets ?? "").join(" ");
    if (METRIC_PATTERN.test(fullText) || (NUMBER_PATTERN.test(fullText) && fullText.length > 100)) {
      bulletsWithMetrics++;
    }
  }
  const experienceSections = sections.filter(
    (s) => s.type === "experience" && (s.items?.length ?? 0) > 0
  ).length;
  const metricScore =
    experienceSections === 0 ? 0 : Math.min(1, bulletsWithMetrics / Math.max(1, experienceSections));
  score += Math.round(metricScore * maxMetrics);
  if (experienceSections > 0 && bulletsWithMetrics === 0) {
    feedback.push(
      "Add quantifiable results (percentages, numbers, time/cost saved) to strengthen your experience bullets."
    );
  }

  // 4. Clarity: summary length, no empty sections
  const summarySection = sections.find((s) => s.type === "summary");
  const summaryLen = summarySection?.body?.trim()?.length ?? 0;
  if (summaryLen > 0 && summaryLen < 50) {
    feedback.push("Expand your summary to 2–4 clear sentences.");
  } else if (summaryLen >= 50 && summaryLen <= 300) {
    score += maxClarity;
  } else if (summaryLen > 300) {
    score += Math.round(maxClarity * 0.7);
    feedback.push("Consider shortening your summary to 2–4 sentences for quick scanning.");
  }

  score = Math.min(100, Math.max(0, score));
  return { score, feedback };
}
