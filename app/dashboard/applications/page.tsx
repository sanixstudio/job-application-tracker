"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, List, Plus, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobList } from "@/components/jobs/JobList";
import { JobKanbanBoard } from "@/components/jobs/JobKanbanBoard";
import { JobForm } from "@/components/jobs/JobForm";
import type { Application, JobFormData } from "@/types";

async function createJob(data: JobFormData): Promise<Application> {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const out = await res.json();
  if (!out.success) throw new Error(out.error || "Failed to create");
  return out.data;
}

const DATE_OPTIONS = [
  { value: "all", label: "All time", days: null as number | null },
  { value: "90", label: "Last 90 days", days: 90 },
];

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [dateFilter, setDateFilter] = useState<"all" | "90">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const dateFilterDays = dateFilter === "90" ? 90 : null;
  const dateLabel = DATE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "All time";

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application added");
      setIsFormOpen(false);
    },
    onError: (err) => {
      toast.error("Could not add application", { description: err.message });
    },
  });

  const handleFormSubmit = async (data: JobFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Application Tracker
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Track status, add applications, and keep your pipeline moving.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[140px] justify-between gap-2">
                <span className="truncate">{dateLabel}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
              {DATE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value as "all" | "90")}
                >
                  {dateFilter === opt.value ? (
                    <Check className="size-4 mr-2 text-(--primary)" />
                  ) : (
                    <span className="w-4 mr-2" aria-hidden />
                  )}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-lg border border-(--border) p-0.5" role="tablist" aria-label="View mode">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-md",
                view === "kanban" && "bg-(--accent) text-(--accent-foreground)"
              )}
              onClick={() => setView("kanban")}
              aria-pressed={view === "kanban"}
              aria-label="Kanban view"
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">Board</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 rounded-md",
                view === "list" && "bg-(--accent) text-(--accent-foreground)"
              )}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
            >
              <List className="size-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        {view === "kanban" && (
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="shadow-sm">
            <Plus className="size-4 mr-2" />
            Add application
          </Button>
        )}
      </div>

      {view === "kanban" ? (
        <JobKanbanBoard dateFilterDays={dateFilterDays} />
      ) : (
        <JobList showHeading={false} />
      )}

      {view === "kanban" && (
        <JobForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
