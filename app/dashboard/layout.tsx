import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Briefcase } from "lucide-react";

/**
 * Dashboard layout: header with logo + Clerk UserButton.
 * All routes under /dashboard are protected by middleware.
 */
export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-(--background)">
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-[var(--foreground)]"
          >
            <Briefcase className="h-5 w-5 text-[var(--primary)]" />
            Trackr
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Home
            </Link>
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
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
