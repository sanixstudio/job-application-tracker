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
 * Client-safe stats cards; data comes from server (dashboard page).
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    { title: "Total", value: stats.total, icon: Briefcase },
    { title: "Applied", value: stats.applied, icon: Clock },
    { title: "Interviews", value: stats.interviews, icon: CheckCircle2 },
    { title: "Offers", value: stats.offers, icon: Trophy },
    { title: "Rejected", value: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card
          key={title}
          className="rounded-xl border-[var(--border)] bg-[var(--card)]"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
