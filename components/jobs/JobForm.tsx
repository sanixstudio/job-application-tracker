"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema } from "@/lib/validations/job";
import type { z } from "zod";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Application, ApplicationStatus, JobFormData } from "@/types";

/** Form values = parsed output of createJobSchema (status/source required after defaults). */
type JobFormValues = z.output<typeof createJobSchema>;

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
    resolver: zodResolver(createJobSchema) as Resolver<JobFormValues>,
    defaultValues: {
      jobTitle: "",
      companyName: "",
      jobUrl: "",
      applicationUrl: "",
      status: "applied",
      source: "manual",
      notes: "",
      salaryRange: "",
      location: "",
    },
  });

  const status = watch("status");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Populate form when dialog opens (edit) or reset when opening for new job
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        jobTitle: initialData.jobTitle,
        companyName: initialData.companyName,
        jobUrl: initialData.jobUrl,
        applicationUrl: initialData.applicationUrl ?? "",
        status: initialData.status,
        source: initialData.source ?? "manual",
        notes: initialData.notes ?? "",
        salaryRange: initialData.salaryRange ?? "",
        location: initialData.location ?? "",
      });
    } else {
      reset({
        jobTitle: "",
        companyName: "",
        jobUrl: "",
        applicationUrl: "",
        status: "applied",
        source: "manual",
        notes: "",
        salaryRange: "",
        location: "",
      });
      setShowMoreOptions(false);
    }
    if (initialData) setShowMoreOptions(!!(initialData.notes || initialData.salaryRange || initialData.location));
  }, [open, initialData, reset]);

  const handleFormSubmit: SubmitHandler<JobFormValues> = async (data) => {
    await onSubmit({
      ...data,
      applicationUrl: data.applicationUrl || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-(--border)">
          <DialogTitle className="text-xl">
            {initialData ? "Edit application" : "Add application"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the details of your job application."
              : "Add a new job application to track."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col min-h-0 flex-1 overflow-hidden"
        >
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
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

          <div className="border-t border-(--border) pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-(--muted-foreground) hover:text-(--foreground)"
              onClick={() => setShowMoreOptions((v) => !v)}
            >
              {showMoreOptions ? (
                <>
                  <ChevronUp className="size-4" aria-hidden />
                  Fewer options
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" aria-hidden />
                  More options (location, salary, notes)
                </>
              )}
            </Button>
            {showMoreOptions && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="e.g., Remote, New York, NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryRange">Salary range</Label>
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
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          <DialogFooter className="px-6 py-4 shrink-0 border-t border-(--border) bg-(--muted)/30">
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
