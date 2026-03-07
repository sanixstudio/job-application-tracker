"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/types";
import { JobKanbanCard } from "./JobKanbanCard";

interface JobKanbanColumnProps {
  columnId: ApplicationStatus;
  label: string;
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
        "flex w-72 shrink-0 flex-col rounded-xl border-2 border-(--border) bg-(--muted)/30 transition-colors",
        active && "border-(--primary)/40 bg-(--primary)/5"
      )}
    >
      <div className="flex items-center gap-2 border-b border-(--border) px-4 py-3">
        <h3 className="font-semibold text-(--foreground)">{label}</h3>
        <span
          className="flex size-6 items-center justify-center rounded-full border border-(--primary) bg-(--background) text-xs font-medium text-(--foreground)"
          aria-label={`${jobs.length} applications`}
        >
          {jobs.length}
        </span>
      </div>
      <div className="flex min-h-[200px] flex-col gap-2 overflow-y-auto p-3">
        {jobs.map((job) => (
          <JobKanbanCard
            key={job.id}
            job={job}
            onOpenJob={onOpenJob}
          />
        ))}
      </div>
    </div>
  );
}
