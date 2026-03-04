import { z } from "zod";

const resumeSectionTypeEnum = z.enum([
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
]);

const resumeSectionSchema = z.object({
  id: z.string(),
  type: resumeSectionTypeEnum,
  heading: z.string(),
  body: z.string().optional(),
  items: z.array(z.record(z.string(), z.string())).optional(),
});

/** Schema for resume content (JSONB). */
export const resumeContentSchema = z.object({
  sections: z.array(resumeSectionSchema).optional().default([]),
});

/** Schema for creating a resume (POST /api/resumes). */
export const createResumeSchema = z.object({
  title: z.string().min(1).optional().default("My Resume"),
  content: resumeContentSchema.optional().default({ sections: [] }),
});

/** Schema for updating a resume (PUT /api/resumes/[id]). */
export const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  content: resumeContentSchema.optional(),
});

export type ResumeContentInput = z.infer<typeof resumeContentSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
