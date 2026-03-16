import type { ResumeContent } from "@/types";

/** Resume score result: 0-100 and actionable feedback (general scoring only). */
export interface ResumeRelevanceResult {
  /** 0–1; how much the content looks like a real resume. */
  relevance: number;
  /** False if content strongly suggests a non-resume document (e.g. article, recipe). */
  isLikelyResume: boolean;
}

/** Phrases/words that strongly suggest career/resume content. */
const RESUME_LIKE_PHRASES = [
  "experience", "professional", "years of", "employed", "role", "position", "manager", "engineer",
  "developer", "analyst", "director", "coordinator", "specialist", "associate", "intern", "internship",
  "education", "degree", "bachelor", "master", "phd", "university", "college", "graduated", "gpa",
  "skills", "summary", "objective", "certification", "certified", "responsibilities", "achieved",
  "led", "managed", "developed", "implemented", "designed", "delivered", "improved", "increased",
  "company", "employer", "client", "team", "project", "curriculum", "résumé", "resume", "cv",
  "job", "career", "work experience", "employment", "technical skills", "soft skills",
];

/** Terms that suggest the document is NOT a resume. Kept specific to avoid false positives:
 *  real resumes often use "character" (character-driven), "story" (user story), "instructions", etc. */
const NON_RESUME_PHRASES = [
  "mullet", "hairstyle", "haircut", "recipe", "ingredients", "bake", "cook", "cooking",
  "film review", "box office", "actor", "actress", "plot twist", "season finale",
  "game score", "team won", "championship", "player stats", "fiction novel",
  "style trend", "celebrity", "how to make", "tutorial video", "blog post", "article about",
];
/** Need this many non-resume phrase hits before we cap the score (avoids one stray word capping real resumes). */
const NON_RESUME_THRESHOLD = 2;

/** Builds a single lowercase text blob from resume content for relevance checks. */
function getFullTextForRelevance(content: ResumeContent): string {
  const sections = content?.sections ?? [];
  const parts: string[] = [];
  for (const s of sections) {
    if (s.body?.trim()) parts.push(s.body.trim());
    for (const item of s.items ?? []) {
      const desc = item.description ?? item.bullets ?? "";
      const title = item.title ?? "";
      const company = item.company ?? "";
      const school = (item as Record<string, string>).school ?? "";
      const degree = (item as Record<string, string>).degree ?? "";
      if (desc) parts.push(desc);
      if (title) parts.push(title);
      if (company) parts.push(company);
      if (school) parts.push(school);
      if (degree) parts.push(degree);
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * Returns how much the content looks like a real resume vs. other document types.
 * Used to cap score and show feedback when the user uploads a non-resume (e.g. article, recipe).
 */
export function getResumeRelevance(content: ResumeContent): ResumeRelevanceResult {
  const text = getFullTextForRelevance(content);
  const len = text.length;
  if (len < 80) return { relevance: 0, isLikelyResume: false };

  let resumeSignals = 0;
  for (const phrase of RESUME_LIKE_PHRASES) {
    if (text.includes(phrase.toLowerCase())) resumeSignals++;
  }

  let nonResumeSignals = 0;
  for (const phrase of NON_RESUME_PHRASES) {
    if (text.includes(phrase.toLowerCase())) nonResumeSignals++;
  }

  const resumeScore = Math.min(1, resumeSignals / 8);
  const nonPenalty = nonResumeSignals >= 1 ? 0.5 * nonResumeSignals : 0;
  const relevance = Math.max(0, Math.min(1, resumeScore - nonPenalty));

  const isLikelyResume =
    relevance >= 0.35 && nonResumeSignals < NON_RESUME_THRESHOLD;

  return { relevance, isLikelyResume };
}

/** Resume score result: 0-100 and actionable feedback (general scoring only). */
export interface ResumeScoreResult {
  score: number;
  feedback: string[];
}

/** Result when scoring against a job description (general + match). */
export interface ResumeScoreWithJobResult {
  /** General quality score (0-100). */
  generalScore: number;
  /** General feedback. */
  generalFeedback: string[];
  /** Match-to-job score (0-100). */
  matchScore: number;
  /** Match-specific feedback. */
  matchFeedback: string[];
  /** Keyword match summary. */
  keywordMatch: {
    found: number;
    total: number;
    /** Sample of keywords from JD that appear in the resume. */
    matchedSample: string[];
    /** Sample of keywords from JD missing from the resume. */
    missingSample: string[];
  };
}

/** Strong action verbs for impact-focused bullets (research-backed). */
const ACTION_VERBS = new Set(
  [
    "achieved", "built", "created", "delivered", "designed", "developed",
    "drove", "established", "improved", "increased", "implemented", "led",
    "managed", "optimized", "reduced", "scaled", "spearheaded", "transformed",
    "launched", "orchestrated", "streamlined", "resolved", "collaborated",
    "mentored", "trained", "facilitated", "engineered", "negotiated",
    "accelerated", "boosted", "coordinated", "executed", "pioneered",
    "restructured", "revitalized", "automated", "consolidated", "expanded",
  ].map((v) => v.toLowerCase())
);

/** Weak/passive patterns that reduce impact. */
const WEAK_PATTERNS = /\b(responsible for|helped with|worked on|was involved in|assisted with|supported)\b/i;

/** Regex for quantifiable metrics: %, $, "increased by X", "N users", etc. */
const METRIC_PATTERN =
  /\d+%|\$\d|%\s*(increase|reduction|growth|decrease)|(\d+x\s*)|(reduced|increased|improved|decreased|saved)\s+by\s+\d+/i;
const NUMBER_PATTERN = /\d+/;

/** Summary length bands (chars). Research: 2–4 sentences = ~80–300. */
const SUMMARY_MIN = 80;
const SUMMARY_IDEAL_MAX = 300;
const SUMMARY_ABSOLUTE_MIN = 20;

/** Skills: ATS and recruiters expect 10–15+ relevant skills. */
const SKILLS_STRONG = 15;
const SKILLS_GOOD = 8;

/** Bullet impact: require 70%+ high-impact bullets for full points (stricter curve). */
const BULLET_RATIO_FULL = 0.7;
const BULLET_RATIO_MIN = 0.3;
/** Bullet length: strong = 50+ chars. */
const BULLET_STRONG_MIN = 50;

/** Optional overrides for scoreResume (e.g. AI classification from parse API). */
export interface ScoreResumeOptions {
  /** When set by the parse API from AI, avoids keyword-based relevance and false positives. */
  isLikelyResume?: boolean;
}

/**
 * Scores a resume (0-100) based on research-backed best practices.
 * See docs/RESUME_SCORING.md for methodology and sources.
 *
 * Criteria: section completeness (25%), impact bullets (30%), quantifiable
 * metrics (25%), summary quality (10%), skills depth (10%).
 * When options.isLikelyResume is provided (e.g. from parse API AI), that is used for the non-resume cap; otherwise we use keyword-based relevance.
 */
export function scoreResume(content: ResumeContent, options?: ScoreResumeOptions): ResumeScoreResult {
  const feedback: string[] = [];
  const sections = content?.sections ?? [];
  let score = 0;

  const maxSection = 25;
  const maxBullets = 30;
  const maxMetrics = 25;
  const maxSummary = 10;
  const maxSkills = 10;

  // -------------------------------------------------------------------------
  // 1. Section completeness (25 pts)
  // -------------------------------------------------------------------------
  const hasSummary = sections.some(
    (s) => s.type === "summary" && (s.body?.trim() ?? "").length > SUMMARY_ABSOLUTE_MIN
  );
  const hasSkills = sections.some(
    (s) => s.type === "skills" && (s.body?.trim() ?? "").length > 2
  );
  const hasExperience = sections.some((s) => {
    if (s.type !== "experience" && s.type !== "projects") return false;
    const items = s.items ?? [];
    return items.some(
      (it) => (String(it.company ?? "").trim().length > 0 || String(it.title ?? "").trim().length > 0)
    );
  });
  const sectionCount = [hasSummary, hasSkills, hasExperience].filter(Boolean).length;
  score += Math.round((sectionCount / 3) * maxSection);

  if (!hasSummary) feedback.push("Add a professional summary (2–4 sentences) at the top.");
  if (!hasSkills) feedback.push("Add a Skills section with relevant technologies and tools.");
  if (!hasExperience) feedback.push("Add at least one experience entry with bullet points.");

  // -------------------------------------------------------------------------
  // 2. Impact bullets (30 pts) — action verb + result or substance
  // -------------------------------------------------------------------------
  let bulletsWithImpact = 0;
  let totalBullets = 0;
  let bulletsWithWeakPattern = 0;

  for (const section of sections) {
    if (section.type !== "experience" && section.type !== "projects") continue;
    for (const item of section.items ?? []) {
      const hasRole = String(item.company ?? "").trim().length > 0 || String(item.title ?? "").trim().length > 0;
      if (!hasRole) continue;
      const desc = (item.description ?? item.bullets ?? "").trim();
      if (!desc) continue;
      const lines = desc.split(/\r?\n/).filter((l) => l.trim().length > 0);
      for (const line of lines) {
        const cleaned = line.trim().replace(/^[•\-*]\s*/, "");
        if (cleaned.length < 10) continue;

        totalBullets++;
        const firstWord = cleaned.split(/\s+/)[0]?.toLowerCase().replace(/[,.:]/, "") ?? "";
        const hasActionVerb =
          ACTION_VERBS.has(firstWord) || firstWord.endsWith("ed");
        const hasMetrics = METRIC_PATTERN.test(cleaned) || (NUMBER_PATTERN.test(cleaned) && cleaned.length > 25);
        const hasSubstance = cleaned.length >= BULLET_STRONG_MIN;
        const isHighImpact = hasActionVerb && (hasMetrics || hasSubstance);

        if (isHighImpact) bulletsWithImpact++;
        if (WEAK_PATTERNS.test(cleaned)) bulletsWithWeakPattern++;
      }
    }
  }

  const bulletRatio = totalBullets > 0 ? bulletsWithImpact / totalBullets : 0;
  if (bulletRatio >= BULLET_RATIO_FULL) {
    score += maxBullets;
  } else if (bulletRatio >= BULLET_RATIO_MIN) {
    score += Math.round(maxBullets * (bulletRatio - BULLET_RATIO_MIN) / (BULLET_RATIO_FULL - BULLET_RATIO_MIN));
  }

  if (totalBullets > 0 && bulletRatio < BULLET_RATIO_FULL) {
    feedback.push(
      "Aim for 70%+ of bullets to start with action verbs (e.g. Led, Improved, Delivered) and include results or metrics."
    );
  }
  if (bulletsWithWeakPattern > 0) {
    feedback.push(
      "Replace weak phrases like 'Responsible for' or 'Helped with' with strong action verbs (e.g. Led, Implemented, Achieved)."
    );
  }

  // -------------------------------------------------------------------------
  // 3. Quantifiable metrics (25 pts)
  // -------------------------------------------------------------------------
  let bulletsWithMetrics = 0;
  for (const section of sections) {
    if (section.type !== "experience" && section.type !== "projects") continue;
    const items = section.items ?? [];
    for (const item of items) {
      const hasRole = String(item.company ?? "").trim().length > 0 || String(item.title ?? "").trim().length > 0;
      if (!hasRole) continue;
      const text = (item.description ?? item.bullets ?? "").trim();
      if (!text) continue;
      if (METRIC_PATTERN.test(text) || (NUMBER_PATTERN.test(text) && text.length > 80)) {
        bulletsWithMetrics++;
      }
    }
  }

  const experienceSections = sections.filter((s) => {
    if (s.type !== "experience" && s.type !== "projects") return false;
    const items = s.items ?? [];
    return items.some(
      (it) => (String(it.company ?? "").trim().length > 0 || String(it.title ?? "").trim().length > 0)
    );
  }).length;
  const metricScore =
    experienceSections === 0
      ? 0
      : Math.min(1, bulletsWithMetrics / Math.max(1, experienceSections));
  score += Math.round(metricScore * maxMetrics);

  if (experienceSections > 0 && bulletsWithMetrics === 0) {
    feedback.push(
      "Add quantifiable results (percentages, numbers, time/cost saved) to strengthen your experience bullets."
    );
  }

  // -------------------------------------------------------------------------
  // 4. Summary quality (10 pts)
  // -------------------------------------------------------------------------
  const summarySection = sections.find((s) => s.type === "summary");
  const summaryLen = summarySection?.body?.trim()?.length ?? 0;

  if (summaryLen >= SUMMARY_MIN && summaryLen <= SUMMARY_IDEAL_MAX) {
    score += maxSummary;
  } else if (summaryLen > SUMMARY_IDEAL_MAX) {
    score += Math.round(maxSummary * 0.6);
    feedback.push("Consider shortening your summary to 2–4 sentences for quick scanning.");
  } else if (summaryLen >= SUMMARY_ABSOLUTE_MIN && summaryLen < SUMMARY_MIN) {
    score += Math.round(maxSummary * 0.4);
    feedback.push("Expand your summary to 2–4 clear sentences (roughly 80–300 characters).");
  } else if (summaryLen > 0 && summaryLen < SUMMARY_ABSOLUTE_MIN) {
    feedback.push("Expand your summary to 2–4 clear sentences.");
  }

  // -------------------------------------------------------------------------
  // 5. Skills depth (10 pts)
  // -------------------------------------------------------------------------
  const skillsSection = sections.find((s) => s.type === "skills");
  const skillsBody = skillsSection?.body?.trim() ?? "";
  const skillCount = skillsBody
    ? skillsBody
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;

  if (skillCount >= SKILLS_STRONG) {
    score += maxSkills;
  } else if (skillCount >= SKILLS_GOOD) {
    score += Math.round(maxSkills * 0.65);
  } else if (skillCount >= 1) {
    score += Math.round(maxSkills * 0.35);
  }
  if (skillCount > 0 && skillCount < SKILLS_GOOD) {
    feedback.push("List at least 8–15 relevant skills; include technologies and tools recruiters and ATS search for.");
  }

  score = Math.min(100, Math.max(0, score));

  // -------------------------------------------------------------------------
  // 6. Resume relevance cap — don't reward non-resume documents
  // -------------------------------------------------------------------------
  const isLikelyResume =
    options?.isLikelyResume !== undefined
      ? options.isLikelyResume
      : getResumeRelevance(content).isLikelyResume;
  if (!isLikelyResume) {
    score = Math.min(score, 40);
    feedback.unshift(
      "This doesn't appear to be a resume. Upload a professional resume (CV) with experience, skills, and education for a meaningful score."
    );
  }

  score = Math.min(100, Math.max(0, score));
  return { score, feedback };
}

/** Common stop words (and very short words) to exclude from JD keyword extraction. */
const STOP_WORDS = new Set(
  [
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "his",
    "was", "one", "our", "out", "day", "get", "has", "him", "how", "its", "may", "new",
    "now", "old", "see", "way", "who", "boy", "did", "got", "let", "put", "say", "she",
    "too", "use", "that", "with", "have", "this", "will", "your", "from", "they", "been",
    "would", "there", "their", "what", "about", "which", "when", "make", "like", "time",
    "into", "more", "than", "them", "some", "could", "other", "these", "should", "after",
    "where", "being", "over", "such", "through", "during", "before", "above", "between",
    "under", "again", "further", "then", "once", "here", "applicant", "applicants",
    "experience", "required", "preferred", "qualifications", "responsibilities", "description",
    "ability", "work", "team", "role", "position", "company", "job", "please", "apply",
  ].map((w) => w.toLowerCase())
);

/** Generic JD words ATS typically don't weight as skills; we exclude them to focus on high-value terms. */
const JD_GENERIC_WORDS = new Set(
  [
    "management", "communication", "environment", "support", "including", "various",
    "within", "across", "multiple", "strong", "excellent", "effective", "related",
    "provide", "ensure", "develop", "working", "knowledge", "understanding",
    "equivalent", "bachelor", "master", "degree", "years", "building", "leading",
    "creating", "developing", "collaborate", "collaboration", "solutions", "projects",
    "business", "client", "clients", "internal", "external", "stakeholders",
    "opportunity", "opportunities", "growth", "success", "quality", "process",
    "processes", "tools", "methodologies", "practices", "standards", "complex",
    "complexity", "technical", "non-technical", "cross-functional", "detail-oriented",
    "self-motivated", "fast-paced", "dynamic", "passionate", "innovative",
  ].map((w) => w.toLowerCase())
);

/** ATS-style: target 10–20 high-value keywords; 60–80% match = good fit. Min 4 allows sql, api, aws, etc. */
const MIN_KEYWORD_LENGTH = 4;
const MAX_JD_KEYWORDS = 20;
const SAMPLE_SIZE = 8;

/** Synonyms: resume may use variant (e.g. JS); we count as match for canonical keyword (e.g. javascript). */
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "machine learning": ["ml", "machine-learning"],
  "artificial intelligence": ["ai", "artificial-intelligence"],
  "user experience": ["ux", "user-experience"],
  "user interface": ["ui", "user-interface"],
  react: ["reactjs", "react.js"],
  "react native": ["react-native", "reactnative"],
  "node.js": ["node", "nodejs"],
  "vue.js": ["vue", "vuejs"],
  "angular": ["angularjs", "angular.js"],
  "amazon web services": ["aws"],
  "continuous integration": ["ci", "continuous-integration"],
  "continuous delivery": ["cd", "continuous-delivery", "continuous deployment"],
  "object-oriented": ["oop", "object oriented"],
  "rest api": ["rest", "restful", "restful api"],
  "graphql": ["graphql api"],
  "sql": ["structured query language"],
  "nosql": ["no-sql", "no sql"],
  "devops": ["dev ops", "ci/cd"],
  "scrum": ["agile scrum"],
  "kubernetes": ["k8s", "kube"],
  "docker": ["container", "containers"],
};

/**
 * Extracts high-value keywords from job description (skills/tech/role terms).
 * Excludes generic JD phrasing so match score reflects ATS-style skill alignment.
 */
function extractKeywordsFromJobDescription(jd: string): string[] {
  const normalized = jd
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^['-]|['-]$/g, "").trim())
    .filter(
      (w) =>
        w.length >= MIN_KEYWORD_LENGTH &&
        !STOP_WORDS.has(w) &&
        !JD_GENERIC_WORDS.has(w) &&
        !/^\d+$/.test(w)
    );
  const count = new Map<string, number>();
  for (const w of normalized) count.set(w, (count.get(w) ?? 0) + 1);
  const sorted = [...count.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, MAX_JD_KEYWORDS).map(([w]) => w);
}

/** Returns true if the keyword (or any of its synonyms) appears in resume text. */
function keywordMatchesResume(keyword: string, resumeText: string): boolean {
  const variants = [keyword, keyword.replace(/-/g, " "), keyword.replace(/\s+/g, "-")];
  const synonyms = KEYWORD_SYNONYMS[keyword] ?? [];
  for (const v of [...variants, ...synonyms]) {
    if (resumeText.includes(v)) return true;
  }
  return false;
}

/**
 * Builds a single searchable text blob from resume content.
 */
function getResumeText(content: ResumeContent): string {
  const sections = content?.sections ?? [];
  const parts: string[] = [];
  for (const s of sections) {
    if (s.body?.trim()) parts.push(s.body.trim());
    for (const item of s.items ?? []) {
      const desc = item.description ?? item.bullets ?? "";
      const title = item.title ?? "";
      const company = item.company ?? "";
      if (desc) parts.push(desc);
      if (title) parts.push(title);
      if (company) parts.push(company);
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * Scores a resume both generally and against a job description.
 * Use this when the user has pasted a job description for a more realistic, application-specific score.
 * See docs/RESUME_SCORING.md for both scoring modes.
 */
export function scoreResumeAgainstJob(
  content: ResumeContent,
  jobDescription: string
): ResumeScoreWithJobResult {
  const trimmedJd = jobDescription.trim();
  const general = scoreResume(content);
  const resumeText = getResumeText(content);
  const keywords = extractKeywordsFromJobDescription(trimmedJd);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of keywords) {
    if (keywordMatchesResume(kw, resumeText)) matched.push(kw);
    else missing.push(kw);
  }

  const total = keywords.length;
  const matchRatio = total > 0 ? matched.length / total : 0;
  const matchScore = Math.round(Math.min(100, matchRatio * 100));

  const matchFeedback: string[] = [];
  if (total === 0) {
    matchFeedback.push("No high-value keywords could be extracted from the job description. Paste a longer description with skills/requirements for a match score.");
  } else if (matchRatio < 0.6) {
    matchFeedback.push(
      `${matched.length} of ${total} key terms from the job description appear in your resume (aim for 60–80% for a strong ATS fit). Add relevant skills and technologies from the posting.`
    );
  } else if (matchRatio < 0.75) {
    matchFeedback.push(
      `${matched.length} of ${total} key terms match. Consider adding a few more skills or technologies from the job description to improve match.`
    );
  } else {
    matchFeedback.push(
      `Strong match: ${matched.length} of ${total} key terms from the job description appear in your resume.`
    );
  }

  return {
    generalScore: general.score,
    generalFeedback: general.feedback,
    matchScore,
    matchFeedback,
    keywordMatch: {
      found: matched.length,
      total,
      matchedSample: matched.slice(0, SAMPLE_SIZE),
      missingSample: missing.slice(0, SAMPLE_SIZE),
    },
  };
}
