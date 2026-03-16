import { z } from "zod";
import {
  type CandidateProfile,
  type ExperienceEntry,
  type AchievementFact,
  type MetricFact,
  type JobDescriptionProfile,
  type ResumeBullet,
  type ResumeVersion,
  type ResumeOsContent,
} from "@/lib/resume/model";

export const ownershipLevelSchema = z.enum([
  "individual",
  "feature_owner",
  "project_owner",
  "team_lead",
]);

export const metricTypeSchema = z.enum(["hard", "scope", "quality", "soft_estimate"]);

export const metricFactSchema: z.ZodType<MetricFact> = z.object({
  type: metricTypeSchema,
  name: z.string(),
  value: z.string(),
  direction: z.enum(["increase", "decrease", "neutral"]),
  before: z.string().optional(),
  after: z.string().optional(),
  timeframe: z.string().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  source: z.string().optional(),
});

export const achievementFactSchema: z.ZodType<AchievementFact> = z.object({
  id: z.string(),
  action: z.string(),
  context: z.string(),
  problem_or_goal: z.string(),
  result: z.string(),
  metric: metricFactSchema.optional(),
  skills_used: z.array(z.string()),
  ownership_level: ownershipLevelSchema,
  confidence: z.enum(["high", "medium", "low"]),
  evidence_source: z.enum(["user_input", "resume", "linkedin", "inferred"]),
});

export const experienceEntrySchema: z.ZodType<ExperienceEntry> = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  start_date: z.string(), // YYYY-MM
  end_date: z.string(), // YYYY-MM or Present
  company_context: z
    .object({
      industry: z.string().optional(),
      business_model: z.string().optional(),
      product_type: z.string().optional(),
      stage: z.string().optional(),
      size: z.string().optional(),
    })
    .optional(),
  responsibilities: z.array(z.string()).optional(),
  achievements: z.array(achievementFactSchema).optional(),
  tools: z.array(z.string()).optional(),
  collaborators: z.array(z.string()).optional(),
  scope_metrics: z.array(metricFactSchema).optional(),
  outcome_metrics: z.array(metricFactSchema).optional(),
  notes: z.array(z.string()).optional(),
});

export const educationEntrySchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  graduation_year: z.string().optional(),
});

export const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tools: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  achievements: z.array(achievementFactSchema).optional(),
});

export const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().optional(),
  issued_year: z.string().optional(),
  expires_year: z.string().optional(),
});

export const writingStyleProfileSchema = z.object({
  tone: z.enum(["plain", "formal", "concise", "warm", "direct"]),
  verbosity: z.enum(["low", "medium", "high"]),
  preferred_sentence_length: z.enum(["short", "mixed", "long"]),
  buzzword_tolerance: z.enum(["low", "medium", "high"]),
  metric_density_tolerance: z.enum(["low", "medium", "high"]),
  repetition_risk: z.enum(["low", "medium", "high"]),
});

export const candidateProfileSchema: z.ZodType<CandidateProfile> = z.object({
  name: z.string(),
  location: z.string().optional(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  target_titles: z.array(z.string()).default([]),
  years_experience: z.number().optional(),
  domains: z.array(z.string()).optional(),
  core_skills: z.array(z.string()).optional(),
  soft_signals: z.array(z.string()).optional(),
  education: z.array(educationEntrySchema).optional(),
  experience: z.array(experienceEntrySchema).optional(),
  projects: z.array(projectEntrySchema).optional(),
  certifications: z.array(certificationEntrySchema).optional(),
  writing_style_profile: writingStyleProfileSchema.optional(),
});

export const seniorityLevelSchema = z.enum([
  "entry",
  "mid",
  "senior",
  "staff",
  "manager",
]);

export const jobDescriptionProfileSchema: z.ZodType<JobDescriptionProfile> = z.object({
  title: z.string(),
  company: z.string().optional(),
  seniority: seniorityLevelSchema,
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()).optional(),
  domain_terms: z.array(z.string()).optional(),
  signal_phrases: z.array(z.string()).optional(),
  responsibility_themes: z.array(z.string()).optional(),
  must_have_filters: z.array(z.string()).optional(),
  nice_to_have_filters: z.array(z.string()).optional(),
  title_variants: z.array(z.string()).optional(),
  summary_of_hiring_priorities: z.array(z.string()).optional(),
});

export const bulletTypeSchema = z.enum([
  "accomplishment",
  "improvement",
  "ownership",
  "leadership",
  "technical_depth",
  "domain",
]);

export const resumeBulletSchema: z.ZodType<ResumeBullet> = z.object({
  id: z.string(),
  text: z.string(),
  source_fact_ids: z.array(z.string()).optional(),
  bullet_type: bulletTypeSchema.optional(),
  keywords_used: z.array(z.string()).optional(),
  metrics_used: z.array(z.string()).optional(),
  human_score: z.number().optional(),
  ats_score: z.number().optional(),
  relevance_score: z.number().optional(),
  defensibility_score: z.number().optional(),
});

export const resumeVersionAuditSchema = z.object({
  atsSafety: z.number(),
  jdAlignment: z.number(),
  experienceQuality: z.number(),
  humanQuality: z.number(),
  defensibility: z.number(),
  total: z.number(),
  riskFlags: z.array(z.string()),
});

export const resumeVersionKindSchema = z.enum([
  "master",
  "jd_tailored",
  "ats_text",
  "human_pdf",
]);

export const resumeVersionSchema: z.ZodType<ResumeVersion> = z.object({
  id: z.string(),
  label: z.string(),
  kind: resumeVersionKindSchema,
  jdProfileId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sections: z.object({
    summary: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(resumeBulletSchema).optional(),
    projects: z.array(resumeBulletSchema).optional(),
    education: z.array(educationEntrySchema).optional(),
  }),
  audit: resumeVersionAuditSchema.optional(),
});

export const resumeOsContentSchema: z.ZodType<ResumeOsContent> = z.object({
  profile: candidateProfileSchema,
  jdProfiles: z.array(jobDescriptionProfileSchema).optional(),
  versions: z.array(resumeVersionSchema).optional(),
});

// Convenience types for consumers
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type JobDescriptionProfileInput = z.infer<typeof jobDescriptionProfileSchema>;
export type ResumeOsContentInput = z.infer<typeof resumeOsContentSchema>;

