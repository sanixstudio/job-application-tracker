"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * Stats cards with semantic color — guides the user: Total (neutral), Applied (info),
 * Interviews (progress), Offers (success), Rejected (attention).
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: "Total",
      value: stats.total,
      icon: Briefcase,
      accent: "",
      iconColor: "text-[var(--muted-foreground)]",
    },
    {
      title: "Applied",
      value: stats.applied,
      icon: Clock,
      accent: "border-l-[3px] border-l-[var(--status-applied)] bg-[var(--status-applied-muted)]/50",
      iconColor: "text-[var(--status-applied)]",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      icon: CheckCircle2,
      accent: "border-l-[3px] border-l-[var(--status-interview)] bg-[var(--status-interview-muted)]/50",
      iconColor: "text-[var(--status-interview)]",
    },
    {
      title: "Offers",
      value: stats.offers,
      icon: Trophy,
      accent: "border-l-[3px] border-l-[var(--status-offer)] bg-[var(--status-offer-muted)]/50",
      iconColor: "text-[var(--status-offer)]",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      accent: "border-l-[3px] border-l-[var(--status-rejected)] bg-[var(--status-rejected-muted)]/50",
      iconColor: "text-[var(--status-rejected)]",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
      {cards.map(({ title, value, icon: Icon, accent, iconColor }) => (
        <Card
          key={title}
          className={`rounded-xl border-[var(--border)] bg-[var(--card)] ${accent}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              {title}
            </CardTitle>
            <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
