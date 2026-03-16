import { z } from "zod";

const MAX_URL_LENGTH = 500;
const MAX_SECTION_LENGTH = 10_000;

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

const optionalProfileUrl = z
  .string()
  .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
  .transform((s) => s.trim())
  .refine((s) => s === "" || isValidUrl(s), "Must be a valid URL")
  .transform((s) => (s === "" ? null : s))
  .optional()
  .nullable();

/** Section keys: LinkedIn = headline, summary; GitHub = bio. */
export const careerProfileSectionKeySchema = z.enum(["headline", "summary", "bio"]);

/** PATCH /api/career-profiles/[id] — update profile URL and/or section current content. */
export const updateCareerProfileSchema = z.object({
  profileUrl: optionalProfileUrl,
  headline: z.string().max(MAX_SECTION_LENGTH).optional(),
  summary: z.string().max(MAX_SECTION_LENGTH).optional(),
  bio: z.string().max(MAX_SECTION_LENGTH).optional(),
});

/** POST /api/career-profiles/[id]/optimize — request AI optimization for one section. */
export const optimizeCareerProfileSectionSchema = z.object({
  section: careerProfileSectionKeySchema,
  /** Optional: current content to optimize (if not provided, use stored current). */
  currentContent: z.string().max(MAX_SECTION_LENGTH).optional(),
});

export type UpdateCareerProfileInput = z.infer<typeof updateCareerProfileSchema>;
export type OptimizeCareerProfileSectionInput = z.infer<
  typeof optimizeCareerProfileSectionSchema
>;
