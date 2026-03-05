import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeAnalytics } from "@/lib/analytics";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { DashboardStats } from "./DashboardStats";
import { EmailInboundCard } from "./EmailInboundCard";
import { EmailSuggestionsCard } from "./EmailSuggestionsCard";
import { ExtensionKeyCard } from "./ExtensionKeyCard";
import { ProfileChecklistCard } from "./ProfileChecklistCard";
import { JobList } from "@/components/jobs/JobList";

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
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-(--foreground) sm:text-4xl">
          Dashboard
        </h1>
        <p className="text-base text-(--muted-foreground)">
          Track and manage your job applications in one place.
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

      <section aria-labelledby="tools-heading" className="space-y-4">
        <h2 id="tools-heading" className="text-lg font-semibold text-(--foreground)">
          Get set up
        </h2>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          <ProfileChecklistCard />
          <ExtensionKeyCard />
        </div>
        <EmailInboundCard />
        <EmailSuggestionsCard />
      </section>

      <section id="jobs" className="scroll-mt-8">
        <JobList />
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
