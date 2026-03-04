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
        <section className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center space-y-10">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl md:text-6xl lg:text-7xl">
              Never lose track of a job application again
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              One place to track applications, interviews, and offers. Update
              status in one click and see your pipeline at a glance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="gap-2 text-base px-8 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/25 transition-shadow"
              >
                <Link href="/dashboard">
                  {userId ? "Go to dashboard" : "Start tracking"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {!userId && (
                <SignInButton mode="modal">
                  <Button variant="outline" size="lg" className="gap-2 text-base border-2">
                    Sign in
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]/40 py-24 md:py-32">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-[var(--foreground)] text-center sm:text-3xl mb-3">
              Everything you need to stay on top of your job search
            </h2>
            <p className="text-[var(--muted-foreground)] text-center max-w-xl mx-auto mb-16">
              Built for developers and job seekers who want clarity without the clutter.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
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
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 md:p-16 shadow-lg border-l-4 border-l-[var(--primary)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl mb-3">
              Ready to organize your job search?
            </h2>
            <p className="text-[var(--muted-foreground)] mb-10">
              {userId
                ? "Head to your dashboard to manage your applications."
                : "Create a free account and start tracking in under a minute."}
            </p>
            <Button asChild size="lg" className="gap-2 shadow-md">
              <Link href="/dashboard">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-10">
        <div className="container mx-auto px-4 text-center text-sm text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Trackr. Job application tracking made simple.
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        {icon}
      </div>
      <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
