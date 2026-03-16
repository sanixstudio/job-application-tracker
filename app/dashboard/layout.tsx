import { DashboardShell } from "./DashboardShell";

/**
 * Dashboard layout: sidebar + header + main content.
 * All routes under /dashboard are protected by middleware.
 */
export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
