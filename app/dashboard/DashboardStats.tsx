"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, CheckCircle2, Clock, XCircle, Trophy } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    rejected: number;
  };
}

const statConfig = [
  {
    title: "Total",
    valueKey: "total" as const,
    icon: Briefcase,
    iconBg: "bg-[var(--muted)]",
    iconColor: "text-[var(--muted-foreground)]",
    cardAccent: "",
  },
  {
    title: "Applied",
    valueKey: "applied" as const,
    icon: Clock,
    iconBg: "bg-[var(--status-applied)]/15",
    iconColor: "text-[var(--status-applied)]",
    cardAccent: "border-l-4 border-l-[var(--status-applied)]",
  },
  {
    title: "Interviews",
    valueKey: "interviews" as const,
    icon: CheckCircle2,
    iconBg: "bg-[var(--status-interview)]/15",
    iconColor: "text-[var(--status-interview)]",
    cardAccent: "border-l-4 border-l-[var(--status-interview)]",
  },
  {
    title: "Offers",
    valueKey: "offers" as const,
    icon: Trophy,
    iconBg: "bg-[var(--status-offer)]/15",
    iconColor: "text-[var(--status-offer)]",
    cardAccent: "border-l-4 border-l-[var(--status-offer)]",
  },
  {
    title: "Rejected",
    valueKey: "rejected" as const,
    icon: XCircle,
    iconBg: "bg-[var(--status-rejected)]/15",
    iconColor: "text-[var(--status-rejected)]",
    cardAccent: "border-l-4 border-l-[var(--status-rejected)]",
  },
];

/**
 * Dashboard stat cards — clear hierarchy: large icon, prominent value, label.
 * Semantic colors guide the user through the pipeline.
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section
      aria-label="Application pipeline summary"
      className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-5"
    >
      {statConfig.map(({ title, valueKey, icon: Icon, iconBg, iconColor, cardAccent }) => (
        <Card
          key={title}
          role="group"
          aria-label={`${title}: ${stats[valueKey]}`}
          className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-200 hover:shadow-md hover:border-[var(--border)]/80 ${cardAccent}`}
        >
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
                aria-hidden
              >
                <Icon className="size-7" strokeWidth={1.75} />
              </span>
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium text-[var(--stat-label)] tracking-tight">
                {title}
              </p>
              <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--stat-value)]">
                {stats[valueKey]}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
