"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobCard } from "./JobCard";
import { JobForm } from "./JobForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Application, JobFormData } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationStatus } from "@/types";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Applications</h2>
          <p className="text-muted-foreground">
            Track and manage your job applications in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview_1">Interview 1</SelectItem>
              <SelectItem value="interview_2">Interview 2</SelectItem>
              <SelectItem value="interview_3">Interview 3</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="p-6">
          <p className="text-destructive">Error loading jobs: {String(error)}</p>
        </Card>
      )}

      {!isLoading && !error && jobs && (
        <>
          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No job applications found.</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Job
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
