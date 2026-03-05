import { z } from "zod";

const MAX_URL_LENGTH = 500;

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/**
 * Optional profile URL: undefined/null/empty clears; non-empty must be valid URL, max 500 chars.
 */
const optionalProfileUrl = z
  .string()
  .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
  .transform((s) => s.trim())
  .refine((s) => s === "" || isValidUrl(s), "Must be a valid URL")
  .transform((s) => (s === "" ? null : s))
  .optional()
  .nullable();

/** Schema for PATCH /api/profile/checklist — update LinkedIn/GitHub URLs. */
export const updateProfileChecklistSchema = z.object({
  linkedinUrl: optionalProfileUrl,
  githubUrl: optionalProfileUrl,
});

export type UpdateProfileChecklistInput = z.infer<
  typeof updateProfileChecklistSchema
>;
