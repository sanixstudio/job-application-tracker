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

export type JobSource = "builtin" | "manual" | "other";

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
