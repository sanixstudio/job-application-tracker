import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Briefcase,
  BarChart3,
  Bell,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

/**
 * Landing page — public. When signed in, shows Dashboard CTAs only (no SignIn modal trigger).
 */
export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight"
          >
            <Briefcase className="h-6 w-6 text-[var(--primary)]" />
            Trackr
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {userId ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserButton
                  appearance={{
                    elements: { avatarBox: "h-8 w-8" },
                  }}
                />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button size="sm">Get started</Button>
                </SignInButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-[var(--foreground)]">
              Never lose track of a job application again
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              One place to track applications, interviews, and offers. Add jobs
              manually, update status in a click, and see your pipeline at a
              glance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="gap-2 text-base px-8 shadow-md ring-2 ring-[var(--primary)]/20"
              >
                <Link href="/dashboard">
                  {userId ? "Go to dashboard" : "Start tracking"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!userId && (
                <SignInButton mode="modal">
                  <Button variant="outline" size="lg" className="gap-2 text-base">
                    Sign in
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/30 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Everything you need to stay on top of your job search
            </h2>
            <p className="text-[var(--muted-foreground)] text-center max-w-xl mx-auto mb-14">
              Built for developers and job seekers who want clarity without the
              clutter.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              <FeatureCard
                icon={<LayoutDashboard className="h-5 w-5" />}
                title="Single dashboard"
                description="All applications in one view. Filter by status and see your funnel at a glance."
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Clear pipeline"
                description="Applied → Interview → Offer. Update status in one click and keep moving."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Status tracking"
                description="Applied, Interview 1–3, Offer, Rejected, Withdrawn. No more spreadsheets."
              />
              <FeatureCard
                icon={<Bell className="h-5 w-5" />}
                title="Your data, private"
                description="Sign in with your account. Your list stays yours and syncs across devices."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 md:p-14 shadow-sm border-l-4 border-l-[var(--primary)]">
            <h2 className="text-2xl font-semibold mb-3">
              Ready to organize your job search?
            </h2>
            <p className="text-[var(--muted-foreground)] mb-8">
              {userId
                ? "Head to your dashboard to manage your applications."
                : "Create a free account and start tracking in under a minute."}
            </p>
            <Button asChild size="lg" className="gap-2 shadow-sm">
              <Link href="/dashboard">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Trackr. Job application tracking made
          simple.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-left shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 text-[var(--primary)]">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
