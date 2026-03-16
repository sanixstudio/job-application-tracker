import { z } from "zod";
import { candidateProfileSchema, jobDescriptionProfileSchema } from "@/lib/validations/resume-os";

/**
 * Schema for POST /api/ai/tailor.
 * jobDescription is required; resumeContent is optional (if omitted, latest resume from DB is used).
 */
export const tailorRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(1, "Job description is required")
    .transform((s) => s.trim()),
  resumeContent: z.record(z.string(), z.unknown()).optional(),
});

export type TailorRequestInput = z.infer<typeof tailorRequestSchema>;

/**
 * Schema for POST /api/ai/jd-profile.
 * Accepts a raw job description and returns a structured JobDescriptionProfile.
 */
export const jdProfileRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(1, "Job description is required")
    .transform((s) => s.trim()),
});

export type JdProfileRequestInput = z.infer<typeof jdProfileRequestSchema>;

/**
 * Schema for POST /api/ai/resume-score.
 * Accepts a CandidateProfile plus a JobDescriptionProfile to score relevance.
 */
export const resumeScoreRequestSchema = z.object({
  profile: candidateProfileSchema,
  jdProfile: jobDescriptionProfileSchema,
});

export type ResumeScoreRequestInput = z.infer<typeof resumeScoreRequestSchema>;

/**
 * Schema for POST /api/ai/bullets.
 * Generates or humanizes bullets from structured achievement facts and JD context.
 */
export const bulletsRequestSchema = z.object({
  mode: z.enum(["generate", "humanize"]).default("generate"),
  jdProfile: jobDescriptionProfileSchema,
  facts: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      context: z.string(),
      problem_or_goal: z.string().optional().default(""),
      result: z.string().optional().default(""),
      metric: z
        .object({
          name: z.string(),
          value: z.string(),
        })
        .optional(),
      skills_used: z.array(z.string()).optional().default([]),
    })
  ),
  existingBullets: z.array(z.string()).optional().default([]),
});

export type BulletsRequestInput = z.infer<typeof bulletsRequestSchema>;

