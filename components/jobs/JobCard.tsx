"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Application } from "@/types";
import { format } from "date-fns";
import { ExternalLink, MapPin, DollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface JobCardProps {
  job: Application;
  onEdit?: (job: Application) => void;
  onDelete?: (id: string) => void;
}

/* Semantic status colors — same tokens as dashboard for consistency */
const statusBadgeClasses: Record<Application["status"], string> = {
  applied: "bg-[var(--status-applied)] text-white border-0",
  interview_1: "bg-[var(--status-interview)] text-white border-0",
  interview_2: "bg-[var(--status-interview)] text-white border-0 opacity-90",
  interview_3: "bg-[var(--status-interview)] text-white border-0 opacity-80",
  offer: "bg-[var(--status-offer)] text-white border-0",
  rejected: "bg-[var(--status-rejected)] text-white border-0",
  withdrawn: "bg-[var(--status-withdrawn)] text-[var(--foreground)] border border-[var(--border)]",
};

const statusLabels: Record<Application["status"], string> = {
  applied: "Applied",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  interview_3: "Interview 3",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  return (
    <Card className="rounded-xl border-[var(--border)] transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight truncate">
              {job.jobTitle}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-[var(--muted-foreground)]">
              {job.companyName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={statusBadgeClasses[job.status]}
              variant="default"
            >
              {statusLabels[job.status]}
            </Badge>
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(job)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted-foreground)]">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {job.location}
            </span>
          )}
          {job.salaryRange && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              {job.salaryRange}
            </span>
          )}
          <span>
            Applied {format(new Date(job.appliedDate), "MMM d, yyyy")}
          </span>
        </div>

        {job.notes && (
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
            {job.notes}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(job.jobUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View job
          </Button>
          {job.applicationUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(job.applicationUrl, "_blank")}
            >
              Application link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
