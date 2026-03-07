"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, MessageSquare, Briefcase } from "lucide-react";

export interface DashboardNextActionsProps {
  /** Applications with follow-up reminder due today or overdue. */
  followUpDueCount: number;
  /** Applications in Applied with no response 7–14 days. */
  noResponse7Count: number;
  /** Applications in Applied with no response 14+ days. */
  staleCount: number;
  /** Applications currently in any interview stage. */
  interviewingCount: number;
  applicationsLink: string;
}

/**
 * Next actions card: follow up due, no response 7+, interviews.
 * Surfaces the most useful next steps for the job seeker.
 */
export function DashboardNextActions({
  followUpDueCount,
  noResponse7Count,
  interviewingCount,
  applicationsLink,
}: DashboardNextActionsProps) {
  const hasActions =
    followUpDueCount > 0 || noResponse7Count > 0 || interviewingCount > 0;
  if (!hasActions) return null;

  const items: { label: string; count: number; icon: React.ReactNode }[] = [];
  if (followUpDueCount > 0) {
    items.push({
      label: "Follow up due",
      count: followUpDueCount,
      icon: <CheckSquare className="size-4 text-(--primary)" aria-hidden />,
    });
  }
  if (noResponse7Count > 0) {
    items.push({
      label: "No response 7+ days — consider following up",
      count: noResponse7Count,
      icon: <Clock className="size-4 text-blue-500" aria-hidden />,
    });
  }
  if (interviewingCount > 0) {
    items.push({
      label: "In interviews",
      count: interviewingCount,
      icon: <MessageSquare className="size-4 text-(--status-interview)" aria-hidden />,
    });
  }

  return (
    <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--primary)/10 text-(--primary)">
            <Briefcase className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-(--foreground)">
              Next actions
            </h2>
            <p className="text-sm text-(--muted-foreground)">
              Your pipeline at a glance
            </p>
          </div>
        </div>
        <ul className="space-y-3" aria-label="Suggested next actions">
          {items.map(({ label, count, icon }) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-(--foreground)">
                {icon}
                {label}
              </span>
              <span className="tabular-nums font-semibold text-(--foreground)">
                {count}
              </span>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="mt-4 w-full sm:w-auto gap-2">
          <Link href={applicationsLink}>
            <Briefcase className="size-4" aria-hidden />
            View applications
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
