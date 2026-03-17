"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";

interface JobKanbanCardProps {
  job: Application;
  isDragging?: boolean;
  onOpenJob?: (job: Application) => void;
}

/** Company initial for avatar placeholder (first letter of company, uppercase). */
function CompanyInitial({ name }: { name: string }) {
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();
  const hue = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
      style={{ backgroundColor: `hsl(${hue}, 55%, 45%)` }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

/**
 * Compact job card for Kanban column: company initial, name, title, age.
 * Draggable via dnd-kit.
 */
export function JobKanbanCard({ job, isDragging, onOpenJob }: JobKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromHook,
  } = useDraggable({
    id: job.id,
    data: { type: "job", job },
  });

  const dragging = isDragging ?? isDraggingFromHook;
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const appliedAgo = formatDistanceToNow(new Date(job.appliedDate), {
    addSuffix: false,
  });
  const ageLabel = appliedAgo.replace("about ", "").replace("over ", ">");

  const followUpDue =
    job.followUpAt &&
    new Date(job.followUpAt).getTime() <=
      new Date().setHours(23, 59, 59, 999);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex rounded-xl border-2 border-(--border) bg-(--card) p-3 shadow-sm transition-shadow hover:shadow-md",
        "cursor-grab active:cursor-grabbing",
        dragging && "opacity-90 shadow-lg ring-2 ring-(--primary)/30 z-50"
      )}
      onClick={() => onOpenJob?.(job)}
      {...attributes}
      {...listeners}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <CompanyInitial name={job.companyName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-(--foreground)">
            {job.companyName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm text-(--muted-foreground)">
            {job.jobTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-(--muted-foreground)">{ageLabel}</span>
              {followUpDue && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Follow up
                </span>
              )}
            </div>
            {onOpenJob && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenJob(job);
                }}
                className="rounded p-1 text-(--muted-foreground) hover:bg-(--muted) hover:text-(--foreground)"
                aria-label={`Open ${job.jobTitle}`}
              >
                <ExternalLink className="size-3.5" />
              </button>
            )}
          </div>
        </div>
        <span
          className="pointer-events-none shrink-0 rounded p-1 text-(--muted-foreground) opacity-60 group-hover:opacity-100"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>
      </div>
    </div>
  );
}
