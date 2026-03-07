import { JobList } from "@/components/jobs/JobList";

/**
 * Applications page — dedicated view for job application tracking.
 * Industry standard: separate Applications from dashboard overview (Resumly, Tracky, ApplyArc).
 */
export default function ApplicationsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Applications
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Track status, add applications, and keep your pipeline moving.
        </p>
      </header>
      <JobList showHeading={false} />
    </div>
  );
}
