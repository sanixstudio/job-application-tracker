"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, FileText, Mail, Settings, Home, UserCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applications", label: "Applications", icon: Briefcase },
  { href: "/dashboard/resume", label: "Resume", icon: FileText },
  { href: "/dashboard/resume-os", label: "Resume OS (beta)", icon: FileText },
  { href: "/dashboard/career-profiles", label: "Career profiles", icon: UserCircle, disabled: true },
  { href: "/dashboard/email", label: "Email", icon: Mail },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/**
 * App sidebar: nav groups and links. Used inside SidebarProvider.
 * Collapses to icons on desktop when toggled; drawer on mobile.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" side="left" className="min-w-60!">
      <SidebarHeader className="border-(--sidebar-border)">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-2 font-semibold text-(--foreground) text-lg tracking-tight rounded-lg hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground) transition-colors"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary)">
            <Briefcase className="size-5" />
          </span>
          <span className="truncate group-data-[state=collapsed]:hidden">Trackr</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon, disabled }) => {
                const isActive =
                  !disabled &&
                  (href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === href || pathname.startsWith(href + "/"));
                if (disabled) {
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton disabled className="opacity-60 cursor-not-allowed" aria-disabled="true">
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate group-data-[state=collapsed]:hidden">{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href}>
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate group-data-[state=collapsed]:hidden">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-(--sidebar-border) group-data-[state=collapsed]:hidden">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Home className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
