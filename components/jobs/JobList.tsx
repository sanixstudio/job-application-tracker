"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [jobToDelete, setJobToDelete] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["jobs", statusFilter === "all" ? undefined : statusFilter],
    queryFn: () => fetchJobs(statusFilter === "all" ? undefined : statusFilter),
  });

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application added");
    },
    onError: (err) => {
      toast.error("Could not add application", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application updated");
    },
    onError: (err) => {
      toast.error("Could not update application", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Application removed");
    },
    onError: (err) => {
      toast.error("Could not remove application", { description: err.message });
    },
  });

  const handleSubmit = async (data: JobFormData) => {
    try {
      if (editingJob) {
        await updateMutation.mutateAsync({ id: editingJob.id, data });
        setEditingJob(null);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch {
      // Error already shown via mutation onError toast
    }
  };

  const handleEdit = (job: Application) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const job = jobs?.find((j) => j.id === id);
    if (job) setJobToDelete(job);
  };

  const handleDeleteConfirm = () => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete.id);
      setJobToDelete(null);
    }
  };

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateMutation.mutate({ id, data: { status } });
  };

  const filterLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Filter";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            Applications
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Update status in one click and keep your pipeline moving.
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between gap-2">
                  <div className="h-5 flex-1 max-w-[70%] rounded-md bg-[var(--muted)] animate-pulse" />
                  <div className="h-8 w-24 rounded-md bg-[var(--muted)] animate-pulse shrink-0" />
                </div>
                <div className="h-4 w-3/4 rounded-md bg-[var(--muted)] animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-9 w-24 rounded-md bg-[var(--muted)] animate-pulse" />
                  <div className="h-9 w-28 rounded-md bg-[var(--muted)] animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="rounded-2xl border-[var(--destructive)]/40 bg-[var(--status-rejected-muted)] p-6">
          <p className="text-sm font-medium text-[var(--destructive)]">
            Failed to load applications. {String(error)}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Check your connection and try again.
          </p>
        </Card>
      )}

      {!isLoading && !error && jobs && (
        <>
          {jobs.length === 0 ? (
            <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-14 text-center">
              <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
                <Plus className="size-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No applications yet
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-8">
                Add your first job to start tracking. You can update status anytime with one click.
              </p>
              <Button onClick={() => setIsFormOpen(true)} size="lg" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
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
                  onDelete={handleDeleteClick}
                  onStatusChange={handleStatusChange}
                  isUpdatingStatus={updateMutation.isPending}
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

      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-[var(--foreground)]">
                {jobToDelete?.jobTitle}
              </span>{" "}
              at {jobToDelete?.companyName}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setJobToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
