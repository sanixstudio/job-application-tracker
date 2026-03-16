import type { Resume } from "@/types";

/**
 * Canonical resume OS domain model, adapted from the Resume SaaS Operating Manual.
 * These types are used by the new Resume workspace, AI routes, and export templates.
 */

export type OwnershipLevel =
  | "individual"
  | "feature_owner"
  | "project_owner"
  | "team_lead";

export type MetricType = "hard" | "scope" | "quality" | "soft_estimate";

export interface MetricFact {
  type: MetricType;
  name: string;
  value: string;
  direction: "increase" | "decrease" | "neutral";
  before?: string;
  after?: string;
  timeframe?: string;
  confidence?: "high" | "medium" | "low";
  source?: string;
}

export interface AchievementFact {
  id: string;
  action: string;
  context: string;
  problem_or_goal: string;
  result: string;
  metric?: MetricFact;
  skills_used: string[];
  ownership_level: OwnershipLevel;
  confidence: "high" | "medium" | "low";
  evidence_source: "user_input" | "resume" | "linkedin" | "inferred";
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location?: string;
  start_date: string; // YYYY-MM
  end_date: string; // YYYY-MM or "Present"
  company_context?: {
    industry?: string;
    business_model?: string;
    product_type?: string;
    stage?: string;
    size?: string;
  };
  responsibilities?: string[];
  achievements?: AchievementFact[];
  tools?: string[];
  collaborators?: string[];
  scope_metrics?: MetricFact[];
  outcome_metrics?: MetricFact[];
  notes?: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree?: string;
  field?: string;
  graduation_year?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description?: string;
  tools?: string[];
  links?: string[];
  achievements?: AchievementFact[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer?: string;
  issued_year?: string;
  expires_year?: string;
}

export interface WritingStyleProfile {
  tone: "plain" | "formal" | "concise" | "warm" | "direct";
  verbosity: "low" | "medium" | "high";
  preferred_sentence_length: "short" | "mixed" | "long";
  buzzword_tolerance: "low" | "medium" | "high";
  metric_density_tolerance: "low" | "medium" | "high";
  repetition_risk: "low" | "medium" | "high";
}

export interface CandidateProfile {
  name: string;
  location?: string;
  contact: {
    email: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  target_titles: string[];
  years_experience?: number;
  domains?: string[];
  core_skills?: string[];
  soft_signals?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  writing_style_profile?: WritingStyleProfile;
}

export type SeniorityLevel = "entry" | "mid" | "senior" | "staff" | "manager";

export interface JobDescriptionProfile {
  title: string;
  company?: string;
  seniority: SeniorityLevel;
  required_skills: string[];
  preferred_skills?: string[];
  domain_terms?: string[];
  signal_phrases?: string[];
  responsibility_themes?: string[];
  must_have_filters?: string[];
  nice_to_have_filters?: string[];
  title_variants?: string[];
  summary_of_hiring_priorities?: string[];
}

export type BulletType =
  | "accomplishment"
  | "improvement"
  | "ownership"
  | "leadership"
  | "technical_depth"
  | "domain";

export interface ResumeBullet {
  id: string;
  text: string;
  source_fact_ids?: string[];
  bullet_type?: BulletType;
  keywords_used?: string[];
  metrics_used?: string[];
  human_score?: number;
  ats_score?: number;
  relevance_score?: number;
  defensibility_score?: number;
}

export interface ResumeVersionAudit {
  atsSafety: number;
  jdAlignment: number;
  experienceQuality: number;
  humanQuality: number;
  defensibility: number;
  total: number;
  riskFlags: string[];
}

export type ResumeVersionKind =
  | "master"
  | "jd_tailored"
  | "ats_text"
  | "human_pdf";

export interface ResumeVersion {
  id: string;
  label: string;
  kind: ResumeVersionKind;
  jdProfileId?: string;
  createdAt: string;
  updatedAt: string;
  sections: {
    summary?: string;
    skills?: string[];
    experience?: ResumeBullet[];
    projects?: ResumeBullet[];
    education?: EducationEntry[];
    // Additional optional sections can be added later.
  };
  audit?: ResumeVersionAudit;
}

export interface ResumeOsContent {
  /** Canonical candidate profile from all evidence sources. */
  profile: CandidateProfile;
  /** Parsed job descriptions the user has tailored to. */
  jdProfiles?: JobDescriptionProfile[];
  /** Different resume variants (master, JD-specific, ATS text, etc.). */
  versions?: ResumeVersion[];
}

/**
 * Convenience helper to get the ResumeOsContent view from the existing Resume record.
 * For v1 we store it under resume.content.profile/jdProfiles/versions.
 */
export function getResumeOsContent(resume: Resume | null): ResumeOsContent | null {
  if (!resume) return null;
  const anyContent = resume.content as unknown as {
    profile?: CandidateProfile;
    jdProfiles?: JobDescriptionProfile[];
    versions?: ResumeVersion[];
  };
  if (!anyContent.profile) return null;
  return {
    profile: anyContent.profile,
    jdProfiles: anyContent.jdProfiles ?? [],
    versions: anyContent.versions ?? [],
  };
}

