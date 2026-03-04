import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DashboardStats } from "./DashboardStats";
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

  const stats = await getStats(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-(--muted-foreground) mt-1">
          Track and manage your job applications
        </p>
      </div>

      <DashboardStats stats={stats} />

      <JobList />
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
