"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelCounts } from "@/lib/analytics";
import { BarChart3, Percent, Clock } from "lucide-react";

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
        <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Add applications to see your funnel, response rate, and no-response metrics.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const maxCount = Math.max(
    ...FUNNEL_STAGES.map((s) => funnel[s.key]),
    1
  );

  return (
    <section aria-label="Application analytics" className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Analytics
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--status-interview)]/15 text-[var(--status-interview)]">
              <Percent className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Response rate
              </p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {responseRate}%
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Applications that reached interview or offer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-5 flex items-center gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                No response (14+ days)
              </p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {staleCount}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Still in Applied with no update
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Pipeline funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FUNNEL_STAGES.map(({ key, label, color }) => {
            const count = funnel[key];
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">
                    {label}
                  </span>
                  <span className="tabular-nums text-[var(--muted-foreground)]">
                    {count}
                  </span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-[var(--muted)]"
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
