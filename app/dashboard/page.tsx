import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeAnalytics } from "@/lib/analytics";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { DashboardStats } from "./DashboardStats";
import { ProfileChecklistCard } from "./ProfileChecklistCard";
import { Button } from "@/components/ui/button";
import { Briefcase, Mail } from "lucide-react";

/**
 * Dashboard page — server component.
 * Fetches stats server-side; JobList is client (React Query + forms).
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [stats, analytics] = await Promise.all([
    getStats(userId),
    getAnalytics(userId),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Your pipeline at a glance. Track applications, response rate, and next steps.
        </p>
      </header>

      <section aria-labelledby="pipeline-heading" className="space-y-4">
        <h2 id="pipeline-heading" className="sr-only">
          Pipeline overview
        </h2>
        <DashboardStats stats={stats} />
        <DashboardAnalytics
          funnel={analytics.funnel}
          responseRate={analytics.responseRate}
          staleCount={analytics.staleCount}
        />
      </section>

      <section aria-labelledby="quick-links-heading" className="flex flex-wrap gap-3">
        <h2 id="quick-links-heading" className="sr-only">
          Quick actions
        </h2>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/applications">
            <Briefcase className="size-4" aria-hidden />
            View all applications
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/email">
            <Mail className="size-4" aria-hidden />
            Check email suggestions
          </Link>
        </Button>
      </section>

      <section aria-labelledby="tools-heading" className="space-y-4">
        <div>
          <h2 id="tools-heading" className="text-lg font-semibold text-(--foreground)">
            Get job-ready
          </h2>
          <p className="mt-0.5 text-sm text-(--muted-foreground)">
            Complete your profile to get the most out of Trackr.
          </p>
        </div>
        <ProfileChecklistCard />
      </section>
    </div>
  );
}

async function getStats(userId: string) {
  const list = await db
    .select({ status: applications.status })
    .from(applications)
    .where(eq(applications.userId, userId));

  const total = list.length;
  const byStatus = list.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total,
    applied: byStatus["applied"] ?? 0,
    interview_1: byStatus["interview_1"] ?? 0,
    interview_2: byStatus["interview_2"] ?? 0,
    interview_3: byStatus["interview_3"] ?? 0,
    interviews:
      (byStatus["interview_1"] ?? 0) +
      (byStatus["interview_2"] ?? 0) +
      (byStatus["interview_3"] ?? 0),
    offers: byStatus["offer"] ?? 0,
    rejected: byStatus["rejected"] ?? 0,
    withdrawn: byStatus["withdrawn"] ?? 0,
  };
}

async function getAnalytics(userId: string) {
  const rows = await db
    .select({
      status: applications.status,
      appliedDate: applications.appliedDate,
    })
    .from(applications)
    .where(eq(applications.userId, userId));

  return computeAnalytics(
    rows.map((r) => ({
      status: r.status,
      appliedDate: r.appliedDate,
    }))
  );
}
