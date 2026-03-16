"use client";

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
    <article className="rounded-2xl border-2 border-(--border) bg-(--card) p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Status and actions — full-width row, status left / menu right */}
      <div className="flex items-center justify-between gap-3 border-b border-(--border) pb-3">
        <div className="min-w-0 shrink-0">
          {onStatusChange ? (
            <Select
              value={job.status}
              onValueChange={(value) => onStatusChange(job.id, value as ApplicationStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="h-9 min-w-32 border-(--border) bg-(--card) text-sm font-medium">
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
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${statusBadgeBg[job.status]}`}
            >
              {statusLabels[job.status]}
            </span>
          )}
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
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

      {/* Role and company — clear hierarchy, room to read */}
      <header className="mt-4 space-y-1.5">
        <h3 className="text-lg font-semibold leading-tight text-(--foreground) tracking-tight line-clamp-2 wrap-break-word">
          {job.jobTitle}
        </h3>
        <p className="text-sm font-medium text-(--muted-foreground)">
          {job.companyName}
        </p>
      </header>

      {/* Meta: location, salary, date — easy to scan */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-(--muted-foreground)">
        {job.location && (
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 opacity-70" />
            {job.location}
          </span>
        )}
        {job.salaryRange && (
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0 opacity-70" />
            {job.salaryRange}
          </span>
        )}
        <span>Applied {format(new Date(job.appliedDate), "MMM d, yyyy")}</span>
      </div>

      {job.notes && (
        <p className="mt-4 text-sm leading-relaxed text-(--muted-foreground) line-clamp-2">
          {job.notes}
        </p>
      )}

      {/* Primary actions — clear footer */}
      <div className="mt-5 flex flex-wrap gap-3 border-t border-(--border) pt-4">
        <Button
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
    </article>
  );
}
