"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const TIPS = [
  "First follow-up: 5–7 business days after applying if you hear nothing.",
  "Tailored resumes tend to get more interviews — use Tailor for this job on your resume.",
  "Track which resume you used per application to see what works best.",
];

/**
 * Short, research-backed tips for job seekers. Shown on dashboard (sidebar in two-column layout).
 */
export function DashboardTips() {
  return (
    <Card className="rounded-xl border border-(--border) bg-(--card) shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Lightbulb className="size-3.5" strokeWidth={1.5} aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-(--foreground)">
            Job search tips
          </h2>
        </div>
        <ul className="space-y-1.5 text-xs text-(--muted-foreground)" role="list">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="text-(--primary) shrink-0 mt-0.5" aria-hidden>
                •
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
