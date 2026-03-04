/**
 * Core TypeScript types for the Job Application Automation System
 */

export type ApplicationStatus =
  | "applied"
  | "interview_1"
  | "interview_2"
  | "interview_3"
  | "offer"
  | "rejected"
  | "withdrawn";

export type JobSource = "builtin" | "manual" | "other" | "extension";

export interface Application {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  applicationUrl?: string;
  status: ApplicationStatus;
  appliedDate: Date;
  source: JobSource;
  emailId?: string;
  notes?: string;
  salaryRange?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTracking {
  id: string;
  userId: string;
  emailId: string;
  fromAddress: string;
  subject: string;
  receivedDate: Date;
  processed: boolean;
  jobLinks: string[];
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  gmailAddress?: string;
  sheetsId?: string;
  checkFrequency: "twice_daily" | "daily" | "hourly";
  autoApply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobFormData {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  applicationUrl?: string;
  status?: ApplicationStatus;
  notes?: string;
  salaryRange?: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// Resume (v1) — shared by API, UI, and DB schema
// ---------------------------------------------------------------------------

export type ResumeSectionType =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects";

export interface ResumeExperienceItem {
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  heading: string;
  body?: string;
  items?: Array<Record<string, string>>;
}

/** Snapshot of the last applied tailor suggestion (shown as chips + optional details). */
export interface LastTailorSnapshot {
  keywords: string[];
  tailoredSummary?: string;
  bulletSuggestions?: string[];
}

/** Resume content stored in DB as JSONB. */
export interface ResumeContent {
  sections?: ResumeSection[];
  /** When user applies a tailor suggestion, we store keywords (and optional summary/bullets) for display. */
  lastTailorSnapshot?: LastTailorSnapshot;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  content: ResumeContent;
  createdAt: Date;
  updatedAt: Date;
}

/** API body: create resume (POST). */
export interface CreateResumeInput {
  title?: string;
  content?: ResumeContent;
}

/** API body: update resume (PUT). */
export interface UpdateResumeInput {
  title?: string;
  content?: ResumeContent;
}
