"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Application } from "@/types";
import { format } from "date-fns";
import { ExternalLink, MapPin, DollarSign } from "lucide-react";

interface JobCardProps {
  job: Application;
  onEdit?: (job: Application) => void;
  onDelete?: (id: string) => void;
}

const statusColors: Record<Application["status"], string> = {
  applied: "bg-blue-500",
  interview_1: "bg-yellow-500",
  interview_2: "bg-orange-500",
  interview_3: "bg-purple-500",
  offer: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{job.jobTitle}</CardTitle>
            <CardDescription className="text-base font-medium">
              {job.companyName}
            </CardDescription>
          </div>
          <Badge
            className={`${statusColors[job.status]} text-white`}
            variant="default"
          >
            {statusLabels[job.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salaryRange && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{job.salaryRange}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>Applied:</span>
            <span>{format(new Date(job.appliedDate), "MMM d, yyyy")}</span>
          </div>
        </div>

        {job.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{job.notes}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(job.jobUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Job
          </Button>
          {job.applicationUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(job.applicationUrl, "_blank")}
            >
              Application Link
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(job)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(job.id)}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
