import { auth, currentUser } from "@clerk/nextjs/server";
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
import { Briefcase, Mail, ArrowRight } from "lucide-react";
import { DashboardNextActions } from "./DashboardNextActions";
import { DashboardTips } from "./DashboardTips";

/**
 * Dashboard page — server component.
 * Fetches stats server-side. Layout: outcome-first (next actions → stats → analytics → tips & profile).
 */
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [user, stats, analytics] = await Promise.all([
    currentUser(),
    getStats(userId),
    getAnalytics(userId),
  ]);

  const firstName = user?.firstName ?? null;
  const greeting = firstName
    ? `Hi ${firstName}`
    : "Welcome back";

  return (
    <div className="space-y-8">
      {/* Hero: greeting + one-line summary + primary CTA */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
            Your pipeline at a glance. Track applications, response rate, and next steps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-2 shadow-sm">
            <Link href="/dashboard/applications">
              <Briefcase className="size-4" aria-hidden />
              View applications
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dashboard/email">
              <Mail className="size-4" aria-hidden />
              Email suggestions
            </Link>
          </Button>
        </div>
      </header>

      {/* Primary: next actions (outcome-first) */}
      <section aria-labelledby="next-actions-heading">
        <h2 id="next-actions-heading" className="sr-only">
          Next actions
        </h2>
        <DashboardNextActions
          followUpDueCount={analytics.followUpDueCount}
          noResponse7Count={analytics.noResponse7Count}
          staleCount={analytics.staleCount}
          interviewingCount={analytics.interviewingCount}
          applicationsLink="/dashboard/applications"
          totalApplications={stats.total}
        />
      </section>

      {/* Pipeline stats */}
      <section aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
          Pipeline overview
        </h2>
        <DashboardStats stats={stats} />
      </section>

      {/* Two-column: analytics (main) + tips & profile */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="analytics-heading">
          <h2 id="analytics-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
            Analytics
          </h2>
          <DashboardAnalytics
            funnel={analytics.funnel}
            responseRate={analytics.responseRate}
            staleCount={analytics.staleCount}
            noResponse7Count={analytics.noResponse7Count}
          />
        </section>

        <aside className="space-y-6" aria-label="Tips and profile">
          <DashboardTips />
          <div>
            <h2 id="profile-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--muted-foreground)">
              Get job-ready
            </h2>
            <ProfileChecklistCard />
          </div>
        </aside>
      </div>
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
    {} as Record<string, number>,
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
      followUpAt: applications.followUpAt,
    })
    .from(applications)
    .where(eq(applications.userId, userId));

  return computeAnalytics(
    rows.map((r) => ({
      status: r.status,
      appliedDate: r.appliedDate,
      followUpAt: r.followUpAt ?? undefined,
    })),
  );
}
