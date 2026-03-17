"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";
import { JobKanbanCard } from "./JobKanbanCard";

interface JobKanbanColumnProps {
  columnId: ApplicationStatus;
  label: string;
  description?: string;
  accentClassName?: string;
  jobs: Application[];
  isOver?: boolean;
  onOpenJob?: (job: Application) => void;
}

/**
 * Single Kanban column: droppable area with title, count, and job cards.
 */
export function JobKanbanColumn({
  columnId,
  label,
  description,
  accentClassName,
  jobs,
  isOver,
  onOpenJob,
}: JobKanbanColumnProps) {
  const { setNodeRef, isOver: isOverFromHook } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  const active = isOver ?? isOverFromHook;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[18rem] flex-col rounded-xl border-2 border-(--border) bg-(--muted)/30 transition-colors",
        active && "border-(--primary)/40 bg-(--primary)/5"
      )}
    >
      <div className="border-b border-(--border) px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-(--foreground)">{label}</h3>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-(--muted-foreground)">
                {description}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              accentClassName ?? "bg-(--primary)/10 text-(--foreground)"
            )}
            aria-label={`${jobs.length} applications`}
            title={`${jobs.length} applications`}
          >
            {jobs.length}
          </span>
        </div>
      </div>
      <div className="flex min-h-[220px] flex-col gap-2 overflow-y-auto p-3 max-h-[70vh]">
        {jobs.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-(--border) bg-(--background)/40 px-4 py-10 text-center",
              active && "border-(--primary)/40 bg-(--primary)/5"
            )}
          >
            <p className="text-sm font-medium text-(--foreground)">
              {active ? "Drop to move here" : "No applications yet"}
            </p>
            <p className="mt-1 text-xs text-(--muted-foreground)">
              {active
                ? "Release to update status."
                : "Drag a card into this column to update its status."}
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobKanbanCard key={job.id} job={job} onOpenJob={onOpenJob} />
          ))
        )}
      </div>
    </div>
  );
}
