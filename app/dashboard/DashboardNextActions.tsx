"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, MessageSquare, Briefcase, ArrowRight, Sparkles } from "lucide-react";

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
  /** Total applications (for empty state when no actions). */
  totalApplications?: number;
}

/**
 * Next actions card: follow up due, no response 7+, interviews.
 * Outcome-first: surfaces the most useful next steps. Shows empty state when caught up or no data.
 */
export function DashboardNextActions({
  followUpDueCount,
  noResponse7Count,
  interviewingCount,
  applicationsLink,
  totalApplications = 0,
}: DashboardNextActionsProps) {
  const hasActions =
    followUpDueCount > 0 || noResponse7Count > 0 || interviewingCount > 0;

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
    <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden bg-linear-to-br from-(--card) to-(--muted)/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary)/10 text-(--primary)">
              <Briefcase className="size-6" strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-(--foreground)">
                Next actions
              </h2>
              <p className="text-sm text-(--muted-foreground)">
                {hasActions
                  ? "Suggested next steps for your pipeline"
                  : totalApplications === 0
                    ? "Add applications to see what to do next"
                    : "You're all caught up for now"}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
            <Link href={applicationsLink}>
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>

        {hasActions ? (
          <>
            <ul className="mt-5 space-y-3" aria-label="Suggested next actions">
              {items.map(({ label, count, icon }) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-(--border)/60 bg-(--background)/50 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2.5 text-sm text-(--foreground)">
                    {icon}
                    {label}
                  </span>
                  <span className="tabular-nums font-semibold text-(--foreground)">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : totalApplications === 0 ? (
          <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-dashed border-(--border) bg-(--muted)/20 p-5">
            <span className="flex items-center gap-2 text-sm font-medium text-(--foreground)">
              <Sparkles className="size-4 text-(--primary)" aria-hidden />
              Get started by adding your first application
            </span>
            <Button asChild size="sm" className="gap-2">
              <Link href={applicationsLink}>
                <Briefcase className="size-4" aria-hidden />
                Add application
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
