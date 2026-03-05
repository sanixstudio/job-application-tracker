"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Application, ApplicationStatus } from "@/types";
import { format } from "date-fns";
import { ExternalLink, MapPin, DollarSign, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface JobCardProps {
  job: Application;
  onEdit?: (job: Application) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: ApplicationStatus) => void;
  isUpdatingStatus?: boolean;
}

const statusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview_1: "Interview 1",
  interview_2: "Interview 2",
  interview_3: "Interview 3",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Badge background when status is read-only (no onStatusChange) */
const statusBadgeBg: Record<ApplicationStatus, string> = {
  applied: "bg-(--status-applied) text-white",
  interview_1: "bg-(--status-interview) text-white",
  interview_2: "bg-(--status-interview) text-white opacity-90",
  interview_3: "bg-(--status-interview) text-white opacity-80",
  offer: "bg-(--status-offer) text-white",
  rejected: "bg-(--status-rejected) text-white",
  withdrawn: "bg-(--status-withdrawn) text-(--foreground) border border-(--border)",
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "interview_1",
  "interview_2",
  "interview_3",
  "offer",
  "rejected",
  "withdrawn",
];

export function JobCard({ job, onEdit, onDelete, onStatusChange, isUpdatingStatus }: JobCardProps) {
  return (
    <Card className="rounded-2xl border border-(--border) bg-(--card) shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight truncate">
              {job.jobTitle}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-(--muted-foreground)">
              {job.companyName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onStatusChange ? (
              <Select
                value={job.status}
                onValueChange={(value) => onStatusChange(job.id, value as ApplicationStatus)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="h-8 min-w-[120px] border-(--border) bg-(--card) text-xs font-medium">
                  <SelectValue>{statusLabels[job.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${statusBadgeBg[job.status]}`}
              >
                {statusLabels[job.status]}
              </span>
            )}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--muted-foreground)">
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
          <p className="text-sm text-(--muted-foreground) line-clamp-2">
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
