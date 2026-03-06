"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FunnelCounts } from "@/lib/analytics";
import { BarChart3, Percent, Clock, Plus } from "lucide-react";

export interface DashboardAnalyticsProps {
  funnel: FunnelCounts;
  responseRate: number;
  staleCount: number;
}

const FUNNEL_STAGES: { key: keyof FunnelCounts; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "var(--status-applied)" },
  { key: "interview_1", label: "Interview 1", color: "var(--status-interview)" },
  { key: "interview_2", label: "Interview 2", color: "var(--status-interview)" },
  { key: "interview_3", label: "Interview 3", color: "var(--status-interview)" },
  { key: "offer", label: "Offer", color: "var(--status-offer)" },
  { key: "rejected", label: "Rejected", color: "var(--status-rejected)" },
  { key: "withdrawn", label: "Withdrawn", color: "var(--muted-foreground)" },
];

/**
 * Analytics section: funnel chart, response rate, and stale (no response 14+ days) count.
 * Shows empty state when there are no applications.
 */
export function DashboardAnalytics({
  funnel,
  responseRate,
  staleCount,
}: DashboardAnalyticsProps) {
  if (funnel.total === 0) {
    return (
      <section aria-label="Application analytics">
        <Card className="rounded-2xl border-2 border-(--border) bg-(--card) bg-gradient-to-b from-(--primary)/5 to-transparent shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-(--primary)/10 text-(--primary)">
                <BarChart3 className="size-7" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-lg font-semibold text-(--foreground)">
                  Analytics
                </CardTitle>
                <p className="mt-0.5 text-sm text-(--muted-foreground)">
                  Add applications to see your funnel, response rate, and no-response metrics.
                </p>
                <Button asChild size="sm" className="mt-3 gap-2">
                  <Link href="#jobs">
                    <Plus className="size-4" aria-hidden />
                    Add your first application
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const maxCount = Math.max(
    ...FUNNEL_STAGES.map((s) => funnel[s.key]),
    1
  );

  return (
    <section aria-label="Application analytics" className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--primary)/10 text-(--primary)">
          <BarChart3 className="size-5" strokeWidth={1.5} />
        </span>
        <h2 className="text-lg font-semibold text-(--foreground)">
          Analytics
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--status-interview)/15 text-(--status-interview)">
              <Percent className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-(--muted-foreground)">
                Response rate
              </p>
              <p className="text-2xl font-bold tabular-nums text-(--foreground)">
                {responseRate}%
              </p>
              <p className="text-xs text-(--muted-foreground)">
                Applications that reached interview or offer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-(--muted-foreground)">
                No response (14+ days)
              </p>
              <p className="text-2xl font-bold tabular-nums text-(--foreground)">
                {staleCount}
              </p>
              <p className="text-xs text-(--muted-foreground)">
                Still in Applied with no update
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden">
        <CardHeader className="border-b border-(--border) bg-gradient-to-b from-(--primary)/5 to-transparent px-6 py-4">
          <CardTitle className="text-base font-semibold text-(--foreground)">
            Pipeline funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 py-4">
          {FUNNEL_STAGES.map(({ key, label, color }) => {
            const count = funnel[key];
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-(--foreground)">
                    {label}
                  </span>
                  <span className="tabular-nums text-(--muted-foreground)">
                    {count}
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-(--muted)"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
