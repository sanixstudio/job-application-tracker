"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Application, ApplicationStatus, JobFormData } from "@/types";

const jobFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobUrl: z.string().url("Must be a valid URL"),
  applicationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum([
    "applied",
    "interview_1",
    "interview_2",
    "interview_3",
    "offer",
    "rejected",
    "withdrawn",
  ]),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobFormData) => Promise<void>;
  initialData?: Application | null;
}

export function JobForm({ open, onOpenChange, onSubmit, initialData }: JobFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: initialData
      ? {
          jobTitle: initialData.jobTitle,
          companyName: initialData.companyName,
          jobUrl: initialData.jobUrl,
          applicationUrl: initialData.applicationUrl || "",
          status: initialData.status,
          notes: initialData.notes || "",
          salaryRange: initialData.salaryRange || "",
          location: initialData.location || "",
        }
      : {
          status: "applied",
        },
  });

  const status = watch("status");

  const handleFormSubmit = async (data: JobFormValues) => {
    await onSubmit({
      ...data,
      applicationUrl: data.applicationUrl || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Job Application" : "Add Job Application"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the details of your job application."
              : "Add a new job application to track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                {...register("jobTitle")}
                placeholder="e.g., Senior Software Engineer"
              />
              {errors.jobTitle && (
                <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="e.g., Google"
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL *</Label>
            <Input
              id="jobUrl"
              {...register("jobUrl")}
              type="url"
              placeholder="https://..."
            />
            {errors.jobUrl && (
              <p className="text-sm text-destructive">{errors.jobUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationUrl">Application URL</Label>
            <Input
              id="applicationUrl"
              {...register("applicationUrl")}
              type="url"
              placeholder="https://..."
            />
            {errors.applicationUrl && (
              <p className="text-sm text-destructive">{errors.applicationUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as ApplicationStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interview_1">Interview 1</SelectItem>
                  <SelectItem value="interview_2">Interview 2</SelectItem>
                  <SelectItem value="interview_3">Interview 3</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., Remote, New York, NY"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salaryRange">Salary Range</Label>
            <Input
              id="salaryRange"
              {...register("salaryRange")}
              placeholder="e.g., $100k - $150k"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional notes about this application..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Update" : "Add Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
