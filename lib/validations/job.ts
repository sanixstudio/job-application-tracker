import { z } from "zod";

const applicationStatusEnum = z.enum([
  "applied",
  "interview_1",
  "interview_2",
  "interview_3",
  "offer",
  "rejected",
  "withdrawn",
]);

const jobSourceEnum = z.enum(["builtin", "manual", "other", "extension"]);

/** Schema for creating a job application (POST /api/jobs). */
export const createJobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobUrl: z.string().url("Must be a valid URL"),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  status: applicationStatusEnum.optional().default("applied"),
  source: jobSourceEnum.optional().default("manual"),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
});

/** Schema for updating a job application (PUT /api/jobs/[id]). */
export const updateJobSchema = z.object({
  jobTitle: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  jobUrl: z.string().url().optional(),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  status: applicationStatusEnum.optional(),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
