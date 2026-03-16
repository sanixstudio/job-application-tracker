"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Lock } from "lucide-react";

/**
 * Career profiles (LinkedIn / GitHub optimization) — temporarily disabled.
 * Shows a blocked state and a disabled button so the feature is visible but not usable.
 */
export default function CareerProfilesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Career profiles
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          This feature is not available yet.
        </p>
      </header>

      <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden max-w-xl">
        <CardHeader className="border-b border-(--border) bg-(--muted)/30">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--muted) text-(--muted-foreground)">
              <UserCircle className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold text-(--foreground)">
                LinkedIn & GitHub optimization
              </CardTitle>
              <CardDescription>
                Optimize your headline, summary, and bio with AI. Coming soon.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <p className="text-sm text-(--muted-foreground) text-center">
            We’re still working on this. You’ll be able to connect your profiles and get AI suggestions here.
          </p>
          <Button disabled className="gap-2 cursor-not-allowed" aria-disabled="true">
            <Lock className="size-4" aria-hidden />
            Career profiles — coming soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
