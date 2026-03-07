"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Check, Loader2, Pencil, FileText, Linkedin, Github, Briefcase } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import type { ProfileChecklistResponse } from "@/app/api/profile/checklist/route";

async function fetchChecklist(): Promise<ProfileChecklistResponse> {
  const res = await fetch("/api/profile/checklist");
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to load checklist");
  return data.data;
}

async function updateProfileUrls(payload: {
  linkedinUrl?: string | null;
  githubUrl?: string | null;
}): Promise<ProfileChecklistResponse> {
  const res = await fetch("/api/profile/checklist", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to update profile");
  return data.data;
}

/**
 * Dashboard card showing job-ready checklist (resume, LinkedIn, GitHub, first application)
 * and job-ready score. Provides CTAs to complete each item.
 */
export function ProfileChecklistCard() {
  const queryClient = useQueryClient();
  const { data: checklist, isLoading } = useQuery({
    queryKey: ["profile-checklist"],
    queryFn: fetchChecklist,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfileUrls,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile-checklist"], data);
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error("Could not update profile", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState("");
  const [githubInput, setGithubInput] = useState("");

  const handleOpenEdit = () => {
    setLinkedinInput(checklist?.linkedinUrl ?? "");
    setGithubInput(checklist?.githubUrl ?? "");
    setEditOpen(true);
  };

  const handleSaveUrls = () => {
    updateMutation.mutate(
      {
        linkedinUrl: linkedinInput.trim() || null,
        githubUrl: githubInput.trim() || null,
      },
      {
        onSuccess: () => setEditOpen(false),
      }
    );
  };

  if (isLoading || !checklist) {
    return (
      <Card className="rounded-2xl border-2 border-(--border) bg-(--card) shadow-lg overflow-hidden">
        <CardHeader className="pb-2 border-b border-(--border) bg-linear-to-b from-(--primary)/5 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Get job-ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-(--muted) animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 max-w-[200px] rounded bg-(--muted) animate-pulse" />
              <div className="h-3 w-1/2 max-w-[120px] rounded bg-(--muted) animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 rounded bg-(--muted) animate-pulse" style={{ width: `${80 - i * 15}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { completedCount, totalCount, score, hasResume, hasLinkedIn, hasGitHub, hasFirstApplication } = checklist;
  const allComplete = completedCount === totalCount;

  return (
    <Card className="rounded-2xl border-2 border-(--primary)/20 bg-(--card) bg-linear-to-b from-(--primary)/5 to-transparent shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-(--border) bg-linear-to-b from-(--primary)/5 to-transparent">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary)/10 text-(--primary)">
            <ClipboardList className="size-6" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-(--foreground)">
              Get job-ready
            </CardTitle>
            <CardDescription className="mt-0.5">
              Complete these steps to get the most out of Trackr. Your profile is {score}% complete.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-(--foreground)">
            {completedCount}/{totalCount} complete
          </span>
          <div className="flex-1 h-2 rounded-full bg-(--muted) overflow-hidden">
            <div
              className="h-full rounded-full bg-(--primary) transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <ul className="space-y-2">
            <ChecklistItem
              done={hasResume}
              icon={<FileText className="h-4 w-4" />}
              label="Add a resume"
              cta={<Link href="/dashboard/resume">Add resume</Link>}
            />
            <ChecklistItem
              done={hasLinkedIn}
              icon={<Linkedin className="h-4 w-4" />}
              label="Add LinkedIn profile"
              cta={
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="text-(--primary) hover:underline"
                >
                  Add LinkedIn
                </button>
              }
            />
            <ChecklistItem
              done={hasGitHub}
              icon={<Github className="h-4 w-4" />}
              label="Add GitHub profile"
              cta={
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="text-(--primary) hover:underline"
                >
                  Add GitHub
                </button>
              }
            />
            <ChecklistItem
              done={hasFirstApplication}
              icon={<Briefcase className="h-4 w-4" />}
              label="Add your first application"
              cta={
                <Link href="/dashboard/applications" className="text-(--primary) hover:underline">
                  Add application
                </Link>
              }
            />
          </ul>

          <ProfileUrlsDialog
            linkedinValue={linkedinInput}
            githubValue={githubInput}
            onLinkedinChange={setLinkedinInput}
            onGithubChange={setGithubInput}
            onSave={handleSaveUrls}
            saving={updateMutation.isPending}
          />
        </Dialog>

        {allComplete && (
          <p className="text-sm font-medium text-(--primary) flex items-center gap-2">
            <Check className="h-4 w-4" />
            You&apos;re job-ready!
          </p>
        )}

        {(hasLinkedIn || hasGitHub) && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleOpenEdit}>
            <Pencil className="h-4 w-4" />
            Edit profile URLs
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  done,
  icon,
  label,
  cta,
}: {
  done: boolean;
  icon: React.ReactNode;
  label: string;
  cta: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {done ? (
        <Check className="h-5 w-5 shrink-0 text-(--primary)" />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-(--muted-foreground)">
          {icon}
        </span>
      )}
      <span className={done ? "text-(--muted-foreground)" : "text-(--foreground)"}>{label}</span>
      {!done && <span className="ml-auto">{cta}</span>}
    </li>
  );
}

function ProfileUrlsDialog({
  linkedinValue,
  githubValue,
  onLinkedinChange,
  onGithubChange,
  onSave,
  saving,
}: {
  linkedinValue: string;
  githubValue: string;
  onLinkedinChange: (v: string) => void;
  onGithubChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit profile URLs</DialogTitle>
        <DialogDescription>
          Add your LinkedIn and GitHub profile URLs for your job-ready checklist.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <label htmlFor="linkedin-url" className="text-sm font-medium">
            LinkedIn profile URL
          </label>
          <Input
            id="linkedin-url"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedinValue}
            onChange={(e) => onLinkedinChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="github-url" className="text-sm font-medium">
            GitHub profile URL
          </label>
          <Input
            id="github-url"
            type="url"
            placeholder="https://github.com/yourusername"
            value={githubValue}
            onChange={(e) => onGithubChange(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
