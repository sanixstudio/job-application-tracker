"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobCard } from "./JobCard";
import { JobForm } from "./JobForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, ChevronDown, Filter } from "lucide-react";
import { useState } from "react";
import type { Application, JobFormData } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import type { ApplicationStatus } from "@/types";

const STATUS_OPTIONS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "applied", label: "Applied" },
  { value: "interview_1", label: "Interview 1" },
  { value: "interview_2", label: "Interview 2" },
  { value: "interview_3", label: "Interview 3" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

async function fetchJobs(status?: ApplicationStatus): Promise<Application[]> {
  const url = status ? `/api/jobs?status=${status}` : "/api/jobs";
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch jobs");
  return data.data;
}

async function createJob(jobData: JobFormData): Promise<Application> {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to create job");
  return data.data;
}

async function updateJob(id: string, jobData: Partial<JobFormData>): Promise<Application> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to update job");
  return data.data;
}

async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to delete job");
}

export function JobList() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["jobs", statusFilter === "all" ? undefined : statusFilter],
    queryFn: () => fetchJobs(statusFilter === "all" ? undefined : statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const handleSubmit = async (data: JobFormData) => {
    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob.id, data });
      setEditingJob(null);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (job: Application) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this job application?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Filter";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Applications</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Track and manage your job applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[160px] justify-between gap-2">
                <Filter className="h-4 w-4 opacity-70" />
                <span className="truncate">{filterLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={statusFilter === opt.value ? "bg-[var(--accent)]" : undefined}
                >
                  {statusFilter === opt.value ? (
                    <Check className="h-4 w-4 mr-2 text-[var(--primary)]" />
                  ) : (
                    <span className="w-4 mr-2" aria-hidden />
                  )}
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setIsFormOpen(true)} className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add application
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/50 rounded-xl p-6">
          <p className="text-sm text-[var(--destructive)]">
            Failed to load applications. {String(error)}
          </p>
        </Card>
      )}

      {!isLoading && !error && jobs && (
        <>
          {jobs.length === 0 ? (
            <Card className="border-[var(--border)] rounded-xl p-12 text-center">
              <p className="text-[var(--muted-foreground)] mb-6">
                No applications yet. Add your first one to get started.
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add application
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <JobForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingJob(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingJob}
      />
    </div>
  );
}
