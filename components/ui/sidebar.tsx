"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const SIDEBAR_WIDTH = "var(--sidebar-width)";
const SIDEBAR_WIDTH_COLLAPSED = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  state: "expanded" | "collapsed";
  setState: (state: "expanded" | "collapsed") => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarProvider({
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      else setUncontrolledOpen(value);
    },
    [onOpenChange]
  );
  const isMobile = useIsMobile();
  const [state, setState] = React.useState<"expanded" | "collapsed">("expanded");
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setState((s) => (s === "expanded" ? "collapsed" : "expanded"));
  }, [isMobile]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);

  const value: SidebarContextValue = {
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    state,
    setState,
    isMobile,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("flex min-h-svh w-full", className)}
        style={{
          ...style,
          ["--sidebar-width" as string]: SIDEBAR_WIDTH,
          ["--sidebar-width-collapsed" as string]: SIDEBAR_WIDTH_COLLAPSED,
        }}
        data-sidebar="provider"
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "icon",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
    const collapsed = state === "collapsed" && !isMobile;

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side="left"
            className="w-(--sidebar-width-mobile) max-w-(--sidebar-width-mobile) p-0 gap-0 flex flex-col bg-(--background) border-(--border)"
            showCloseButton={true}
          >
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            {children}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        data-side={side}
        data-state={state}
        data-collapsible={collapsible}
        data-sidebar="sidebar"
        className={cn(
          "group sticky top-0 flex h-svh shrink-0 flex-col self-start border-(--sidebar-border) bg-(--background) transition-[width] duration-200 ease-linear",
          "hidden md:flex",
          side === "left" ? "border-r" : "border-l",
          collapsed ? "w-(--sidebar-width-collapsed)" : "w-(--sidebar-width)",
          variant === "inset" && "m-4 h-[calc(100vh-2rem)] rounded-xl",
          className
        )}
        style={{
          width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)",
          minWidth: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)",
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="header"
      className={cn("flex shrink-0 flex-col gap-2 p-4 border-b border-(--sidebar-border)", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col overflow-auto", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="footer"
      className={cn("shrink-0 border-t border-(--sidebar-border) p-4", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group"
      className={cn("flex flex-col gap-1 p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-sidebar="group-label"
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-(--muted-foreground) uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-sidebar="group-content" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-sidebar="menu"
      role="menu"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-sidebar="menu-item"
      role="none"
      className={cn("list-none", className)}
      {...props}
    />
  );
}

interface SidebarMenuButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  isActive?: boolean;
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild, isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium outline-none transition-colors",
          "hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)",
          "focus-visible:ring-2 focus-visible:ring-(--sidebar-ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)",
          isActive && "bg-(--sidebar-accent) text-(--sidebar-accent-foreground)",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={cn(className)}
      aria-label="Toggle sidebar"
      {...props}
    >
      <PanelLeft className="size-5 md:block hidden" />
      <PanelLeftClose className="size-5 md:hidden" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex min-h-svh min-w-0 flex-1 flex-col overflow-x-auto",
        className
      )}
      {...props}
    />
  );
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
};
