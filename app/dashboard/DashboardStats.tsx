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
    iconBg: "bg-(--muted)",
    iconColor: "text-(--muted-foreground)",
    cardAccent: "",
  },
  {
    title: "Applied",
    valueKey: "applied" as const,
    icon: Clock,
    iconBg: "bg-(--status-applied)/15",
    iconColor: "text-(--status-applied)",
    cardAccent: "border-l-4 border-l-(--status-applied)",
  },
  {
    title: "Interviews",
    valueKey: "interviews" as const,
    icon: CheckCircle2,
    iconBg: "bg-(--status-interview)/15",
    iconColor: "text-(--status-interview)",
    cardAccent: "border-l-4 border-l-(--status-interview)",
  },
  {
    title: "Offers",
    valueKey: "offers" as const,
    icon: Trophy,
    iconBg: "bg-(--status-offer)/15",
    iconColor: "text-(--status-offer)",
    cardAccent: "border-l-4 border-l-(--status-offer)",
  },
  {
    title: "Rejected",
    valueKey: "rejected" as const,
    icon: XCircle,
    iconBg: "bg-(--status-rejected)/15",
    iconColor: "text-(--status-rejected)",
    cardAccent: "border-l-4 border-l-(--status-rejected)",
  },
];

/**
 * Dashboard stat cards — clear hierarchy: icon, prominent value, label.
 * Semantic colors guide the user through the pipeline. Scannable at a glance.
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section
      aria-label="Application pipeline summary"
      className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5"
    >
      {statConfig.map(({ title, valueKey, icon: Icon, iconBg, iconColor, cardAccent }) => (
        <Card
          key={title}
          role="group"
          aria-label={`${title}: ${stats[valueKey]}`}
          className={`rounded-xl border border-(--border) bg-(--card) shadow-sm overflow-hidden transition-shadow hover:shadow-md ${cardAccent}`}
        >
          <CardContent className="flex flex-row items-center gap-4 p-4">
            <span
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
              aria-hidden
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-(--muted-foreground) uppercase tracking-wider">
                {title}
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-(--foreground)">
                {stats[valueKey]}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
