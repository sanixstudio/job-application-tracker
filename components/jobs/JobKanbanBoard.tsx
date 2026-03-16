"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Application, ApplicationStatus, JobFormData } from "@/types";
import { JobKanbanCard } from "./JobKanbanCard";
import { JobKanbanColumn } from "./JobKanbanColumn";
import { KANBAN_COLUMNS, statusToColumnId } from "./kanban-constants";

async function fetchJobs(): Promise<Application[]> {
  const res = await fetch("/api/jobs");
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch jobs");
  return data.data;
}

async function updateJob(id: string, data: Partial<JobFormData>): Promise<Application> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const out = await res.json();
  if (!out.success) throw new Error(out.error || "Failed to update");
  return out.data;
}

/** Group jobs by Kanban column id (interview_1/2/3 → interview_1). */
function groupJobsByColumn(jobs: Application[]): Record<ApplicationStatus, Application[]> {
  const groups = KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = [];
      return acc;
    },
    {} as Record<ApplicationStatus, Application[]>
  );
  for (const job of jobs) {
    const colId = statusToColumnId(job.status);
    if (groups[colId]) groups[colId].push(job);
  }
  return groups;
}

interface JobKanbanBoardProps {
  /** Filter jobs by applied date >= (now - days). */
  dateFilterDays?: number | null;
  /** Called when user clicks open on a card; default opens job URL in new tab. */
  onOpenJob?: (job: Application) => void;
}

/**
 * Kanban board: columns by status, drag-and-drop to update status.
 * Uses @dnd-kit for accessibility and smooth UX.
 */
const defaultOpenJob = (job: Application) => {
  window.open(job.jobUrl, "_blank", "noopener,noreferrer");
};

export function JobKanbanBoard({ dateFilterDays = null, onOpenJob = defaultOpenJob }: JobKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Status updated");
    },
    onError: (err) => {
      toast.error("Could not update status", { description: err.message });
    },
  });

  const filteredJobs = useMemo(() => {
    if (dateFilterDays == null) return jobs;
    const cut = new Date();
    cut.setDate(cut.getDate() - dateFilterDays);
    return jobs.filter((j) => new Date(j.appliedDate) >= cut);
  }, [jobs, dateFilterDays]);

  const groups = useMemo(() => groupJobsByColumn(filteredJobs), [filteredJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== "job") return;

    const job = activeData.job as Application;
    let newStatus: ApplicationStatus;

    if (overData?.type === "column") {
      newStatus = overData.columnId as ApplicationStatus;
    } else if (overData?.type === "job") {
      const targetJob = overData.job as Application;
      newStatus = statusToColumnId(targetJob.status) === "interview_1"
        ? targetJob.status
        : (targetJob.status as ApplicationStatus);
    } else {
      return;
    }

    if (job.status === newStatus) return;

    updateMutation.mutate({ id: job.id, data: { status: newStatus } });
  };

  const activeJob = activeId
    ? jobs.find((j) => j.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.id}
            className={cn(
              "h-64 w-72 shrink-0 rounded-xl border-2 border-(--border) bg-(--muted)/20 animate-pulse"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <JobKanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            jobs={groups[col.id] ?? []}
            onOpenJob={onOpenJob}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="w-72 opacity-95">
            <JobKanbanCard job={activeJob} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
