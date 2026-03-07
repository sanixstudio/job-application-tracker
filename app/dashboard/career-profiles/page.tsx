"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Linkedin, Github, Sparkles, Copy, Loader2, ExternalLink } from "lucide-react";
import type { CareerProfile, CareerProfilePlatform, CareerProfileSections } from "@/types";

async function fetchCareerProfiles(): Promise<CareerProfile[]> {
  const res = await fetch("/api/career-profiles");
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to load profiles");
  return data.data;
}

async function updateProfile(
  id: string,
  payload: { profileUrl?: string | null; headline?: string; summary?: string; bio?: string }
): Promise<CareerProfile> {
  const res = await fetch(`/api/career-profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to update");
  return data.data;
}

async function optimizeSection(
  id: string,
  section: "headline" | "summary" | "bio",
  currentContent?: string
): Promise<{ optimized: string; profile: CareerProfile }> {
  const res = await fetch(`/api/career-profiles/${id}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, currentContent }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to optimize");
  return { optimized: data.data.optimized, profile: data.data.profile };
}

const PLATFORM_META: Record<
  CareerProfilePlatform,
  { label: string; icon: typeof Linkedin; sections: ("headline" | "summary" | "bio")[] }
> = {
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    sections: ["headline", "summary"],
  },
  github: {
    label: "GitHub",
    icon: Github,
    sections: ["bio"],
  },
};

const SECTION_LABELS: Record<string, string> = {
  headline: "Headline",
  summary: "About / Summary",
  bio: "Profile bio",
};

export default function CareerProfilesPage() {
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["career-profiles"],
    queryFn: fetchCareerProfiles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-profiles"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const optimizeMutation = useMutation({
    mutationFn: ({
      id,
      section,
      currentContent,
    }: {
      id: string;
      section: "headline" | "summary" | "bio";
      currentContent?: string;
    }) => optimizeSection(id, section, currentContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-profiles"] });
      toast.success("Optimized. Copy and paste it on your profile.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Optimization failed"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
            Career profiles
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
            Loading…
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-2xl border-2 border-(--border) animate-pulse">
              <CardHeader className="pb-2" />
              <CardContent className="h-48 rounded-b-2xl bg-(--muted)/20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-(--foreground) sm:text-3xl">
          Career profiles
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
          Recruiters check your LinkedIn and GitHub. Add your profile URLs and your current
          headline, summary, or bio—then get AI-powered suggestions. Copy the improved text and
          paste it on each platform to stand out.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2" aria-label="LinkedIn and GitHub profiles">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onUpdate={(payload) =>
              updateMutation.mutate({ id: profile.id, payload })
            }
            onOptimize={(section, currentContent) =>
              optimizeMutation.mutate({
                id: profile.id,
                section,
                currentContent,
              })
            }
            isUpdating={updateMutation.isPending}
            isOptimizing={(section) =>
              optimizeMutation.isPending &&
              (optimizeMutation.variables?.section === section)
            }
          />
        ))}
      </section>
    </div>
  );
}

function ProfileCard({
  profile,
  onUpdate,
  onOptimize,
  isUpdating,
  isOptimizing,
}: {
  profile: CareerProfile;
  onUpdate: (payload: {
    profileUrl?: string | null;
    headline?: string;
    summary?: string;
    bio?: string;
  }) => void;
  onOptimize: (
    section: "headline" | "summary" | "bio",
    currentContent?: string
  ) => void;
  isUpdating: boolean;
  isOptimizing: (section: string) => boolean;
}) {
  const meta = PLATFORM_META[profile.platform];
  const Icon = meta.icon;
  const [urlInput, setUrlInput] = useState(profile.profileUrl ?? "");
  const sections = (profile.sections ?? {}) as CareerProfileSections;

  const handleSaveUrl = () => {
    const v = urlInput.trim() || null;
    if (v !== (profile.profileUrl ?? "")) onUpdate({ profileUrl: v });
  };

  return (
    <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden">
      <CardHeader className="border-b border-(--border) bg-linear-to-b from-(--primary)/5 to-transparent">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--muted) text-(--foreground)">
            <Icon className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-(--foreground)">
              {meta.label}
            </CardTitle>
            <CardDescription>
              Current status and AI optimization for your {meta.label} profile
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`url-${profile.id}`}>Profile URL</Label>
          <div className="flex gap-2">
            <Input
              id={`url-${profile.id}`}
              type="url"
              placeholder={
                profile.platform === "linkedin"
                  ? "https://linkedin.com/in/yourprofile"
                  : "https://github.com/yourusername"
              }
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleSaveUrl}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={!profile.profileUrl}
              asChild={!!profile.profileUrl}
            >
              {profile.profileUrl ? (
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${meta.label}`}
                >
                  <ExternalLink className="size-4" />
                </a>
              ) : (
                <span aria-hidden><ExternalLink className="size-4 opacity-50" /></span>
              )}
            </Button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSaveUrl}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Save URL"}
          </Button>
        </div>

        {meta.sections.map((sectionKey) => {
          const sectionData = sections[sectionKey as keyof CareerProfileSections];
          const current = sectionData?.current ?? "";
          const optimized = sectionData?.optimized ?? "";
          const hasOptimized = Boolean(optimized);
          return (
            <SectionBlock
              key={sectionKey}
              sectionKey={sectionKey}
              label={SECTION_LABELS[sectionKey] ?? sectionKey}
              current={current}
              optimized={optimized}
              onSaveCurrent={(text) => onUpdate({ [sectionKey]: text } as Parameters<typeof onUpdate>[0])}
              onOptimize={() => onOptimize(sectionKey, current || undefined)}
              isOptimizing={isOptimizing(sectionKey)}
              hasOptimized={hasOptimized}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function SectionBlock({
  sectionKey,
  label,
  current,
  optimized,
  onSaveCurrent,
  onOptimize,
  isOptimizing,
  hasOptimized,
}: {
  sectionKey: string;
  label: string;
  current: string;
  optimized: string;
  onSaveCurrent: (text: string) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  hasOptimized: boolean;
}) {
  const [localCurrent, setLocalCurrent] = useState(current);
  const isShort = sectionKey === "headline" || sectionKey === "bio";

  useEffect(() => {
    setLocalCurrent(current);
  }, [current]);

  const handleBlur = () => {
    if (localCurrent.trim() !== current) onSaveCurrent(localCurrent.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard. Paste it on your profile.");
  };

  return (
    <div className="space-y-2 rounded-xl border border-(--border) p-4 bg-(--muted)/20">
      <h3 className="text-sm font-semibold text-(--foreground)">{label}</h3>
      <div className="space-y-2">
        <Label className="text-xs text-(--muted-foreground)">Current (paste yours here)</Label>
        {isShort ? (
          <Input
            placeholder={`Your current ${label.toLowerCase()}…`}
            value={localCurrent}
            onChange={(e) => setLocalCurrent(e.target.value)}
            onBlur={handleBlur}
          />
        ) : (
          <Textarea
            placeholder={`Paste your current ${label.toLowerCase()}…`}
            value={localCurrent}
            onChange={(e) => setLocalCurrent(e.target.value)}
            onBlur={handleBlur}
            rows={4}
            className="resize-y"
          />
        )}
      </div>
      <Button
        size="sm"
        className="gap-2"
        onClick={onOptimize}
        disabled={isOptimizing || !localCurrent.trim()}
      >
        {isOptimizing ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        Optimize with AI
      </Button>
      {hasOptimized && (
        <div className="space-y-2 pt-2 border-t border-(--border)">
          <Label className="text-xs text-(--muted-foreground)">Suggested (copy and apply on {sectionKey === "bio" ? "GitHub" : "LinkedIn"})</Label>
          <div className="rounded-lg bg-(--card) border border-(--border) p-3 text-sm text-(--foreground) whitespace-pre-wrap">
            {optimized}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => copyToClipboard(optimized)}
          >
            <Copy className="size-4" aria-hidden />
            Copy to clipboard
          </Button>
        </div>
      )}
    </div>
  );
}
