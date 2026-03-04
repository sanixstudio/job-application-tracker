"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileText, Save, Download } from "lucide-react";
import { useState, useCallback } from "react";
import type { Resume, ResumeContent, ResumeSection } from "@/types";

async function fetchResume(): Promise<Resume | null> {
  const res = await fetch("/api/resumes");
  const data = await res.json();
  if (res.status === 404) return null;
  if (!data.success) throw new Error(data.error || "Failed to fetch resume");
  return data.data;
}

async function createResume(): Promise<Resume> {
  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to create resume");
  return data.data;
}

async function updateResume(id: string, payload: { title?: string; content?: ResumeContent }): Promise<Resume> {
  const res = await fetch(`/api/resumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to update resume");
  return data.data;
}

export default function ResumePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [summaryBody, setSummaryBody] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ["resume"],
    queryFn: fetchResume,
  });

  const enterEditMode = useCallback((r: Resume | null) => {
    if (r) {
      setTitle(r.title);
      const summary = r.content?.sections?.find((s) => s.type === "summary");
      setSummaryBody(summary?.body ?? "");
    } else {
      setTitle("My Resume");
      setSummaryBody("");
    }
    setIsEditing(true);
  }, []);

  const createMutation = useMutation({
    mutationFn: createResume,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      toast.success("Resume created");
      enterEditMode(data);
    },
    onError: (err) => {
      toast.error("Could not create resume", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title?: string; content?: ResumeContent } }) =>
      updateResume(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      toast.success("Resume saved");
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error("Could not save resume", { description: err.message });
    },
  });

  const handleCreate = () => {
    createMutation.mutate();
  };

  const handleDownloadPdf = async () => {
    if (!resume) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/export?format=pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title.replace(/[^a-z0-9-_]/gi, "_") || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Could not download PDF", {
        description: err instanceof Error ? err.message : "Export failed",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCancelEdit = () => {
    if (resume) {
      setTitle(resume.title);
      const summary = resume.content?.sections?.find((s) => s.type === "summary");
      setSummaryBody(summary?.body ?? "");
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!resume) return;
    const sections: ResumeSection[] = [...(resume.content?.sections ?? [])];
    const summaryIdx = sections.findIndex((s) => s.type === "summary");
    const summarySection: ResumeSection = {
      id: summaryIdx >= 0 ? sections[summaryIdx].id : crypto.randomUUID(),
      type: "summary",
      heading: "Summary",
      body: summaryBody,
    };
    if (summaryIdx >= 0) sections[summaryIdx] = summarySection;
    else sections.push(summarySection);

    updateMutation.mutate({
      id: resume.id,
      payload: { title: title || undefined, content: { sections } },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-[var(--border)] p-6">
        <p className="text-sm text-[var(--destructive)]">
          Failed to load resume. {String(error)}
        </p>
      </Card>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Resume</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Create your resume to export or tailor per job later.
          </p>
        </div>
        <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-14 text-center">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <FileText className="size-7" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No resume yet
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-8">
            Create your first resume to start building and editing sections.
          </p>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            size="lg"
            className="gap-2"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create resume
          </Button>
        </Card>
      </div>
    );
  }

  const sectionCount = resume.content?.sections?.length ?? 0;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Edit resume</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Update your title and sections. More section types coming soon.
          </p>
        </div>
        <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resume-title">Title</Label>
              <Input
                id="resume-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Resume"
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-summary">Summary</Label>
              <Textarea
                id="resume-summary"
                value={summaryBody}
                onChange={(e) => setSummaryBody(e.target.value)}
                placeholder="Brief professional summary..."
                rows={4}
                className="resize-y"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Resume</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          {resume.title} · {sectionCount} section{sectionCount !== 1 ? "s" : ""}
        </p>
      </div>
      <Card className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{resume.title}</CardTitle>
          <CardDescription>
            {sectionCount} section{sectionCount !== 1 ? "s" : ""}. Add more in edit mode later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resume.content?.sections?.map((s) => (
            <div key={s.id}>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{s.heading}</h3>
              {s.body && (
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{s.body}</p>
              )}
            </div>
          ))}
          {(!resume.content?.sections?.length || sectionCount === 0) && (
            <p className="text-sm text-[var(--muted-foreground)]">No sections yet. Click Edit to add content.</p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          variant="outline"
          className="gap-2"
        >
          {isExportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </Button>
        <Button onClick={() => enterEditMode(resume)} variant="outline" className="gap-2">
          Edit resume
        </Button>
      </div>
    </div>
  );
}
