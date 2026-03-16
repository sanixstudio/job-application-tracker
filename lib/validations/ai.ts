import { z } from "zod";

/**
 * Schema for POST /api/ai/tailor.
 * jobDescription is required; resumeContent is optional (if omitted, latest resume from DB is used).
 */
export const tailorRequestSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required").transform((s) => s.trim()),
  resumeContent: z.record(z.string(), z.unknown()).optional(),
});

export type TailorRequestInput = z.infer<typeof tailorRequestSchema>;
