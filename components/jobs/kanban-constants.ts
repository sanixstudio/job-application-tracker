import type { ApplicationStatus } from "@/types";

/**
 * Kanban column id matches API status for simplicity.
 * Order: Applied → Interviewing → Offer → Rejected → Withdrawn.
 */
export const KANBAN_COLUMNS: { id: ApplicationStatus; label: string }[] = [
  { id: "applied", label: "Applied" },
  { id: "interview_1", label: "Interviewing" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
  { id: "withdrawn", label: "Withdrawn" },
];

/** Interview stages grouped under "Interviewing" column. */
export const INTERVIEW_STATUSES: ApplicationStatus[] = [
  "interview_1",
  "interview_2",
  "interview_3",
];

/** Map job status to column id (interview_2, interview_3 → interview_1 for column). */
export function statusToColumnId(status: ApplicationStatus): ApplicationStatus {
  if (INTERVIEW_STATUSES.includes(status)) return "interview_1";
  return status;
}

/** All statuses that belong to the "Interviewing" column. */
export function isInterviewColumn(columnId: ApplicationStatus): boolean {
  return columnId === "interview_1";
}
