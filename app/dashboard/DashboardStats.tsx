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
    {
      title: "Total",
      value: stats.total,
      icon: Briefcase,
    },
    {
      title: "Applied",
      value: stats.applied,
      icon: Clock,
    },
    {
      title: "Interviews",
      value: stats.interviews,
      icon: CheckCircle2,
    },
    {
      title: "Offers",
      value: stats.offers,
      icon: Trophy,
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ title, value, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
