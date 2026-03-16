"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * Dashboard shell: sidebar + header + main. Wraps all dashboard pages.
 * Header is sticky with logo, sidebar trigger, theme toggle, and user button (industry standard).
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b border-(--border) bg-(--background)/95 backdrop-blur supports-backdrop-filter:bg-(--background)/80 px-4">
          <SidebarTrigger />
          <div className="flex flex-1 items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-(--foreground) md:hidden"
              aria-label="Trackr home"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary)">
                <Briefcase className="size-4" />
              </span>
              <span>Trackr</span>
            </Link>
          </div>
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
        </header>
        <div className="min-w-0 flex-1 container mx-auto px-4 py-8 max-w-5xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
