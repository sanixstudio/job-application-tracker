import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardNav } from "./DashboardNav";

/**
 * Dashboard layout: header with logo, nav (active state), and Clerk UserButton.
 * All routes under /dashboard are protected by middleware.
 */
export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--background)]/70">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-[var(--foreground)] text-lg tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 rounded-lg"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Briefcase className="size-5" />
            </span>
            Trackr
          </Link>
          <DashboardNav />
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">{children}</main>
    </div>
  );
}
