import type { ApplicationStatus } from "@/types";

/**
 * Kanban column id matches API status for simplicity.
 * Order: Applied → Interviewing → Offer → Rejected → Withdrawn.
 */
export const KANBAN_COLUMNS: {
  id: ApplicationStatus;
  label: string;
  description: string;
  accentClassName: string;
}[] = [
  {
    id: "applied",
    label: "Applied",
    description: "Waiting for a response.",
    accentClassName: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    id: "interview_1",
    label: "Interviewing",
    description: "In process (all interview stages).",
    accentClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    id: "offer",
    label: "Offer",
    description: "Offer received.",
    accentClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Closed out.",
    accentClassName: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  {
    id: "withdrawn",
    label: "Withdrawn",
    description: "You withdrew or role paused.",
    accentClassName: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
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
