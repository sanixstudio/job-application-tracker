"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileText, Save, Download, Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback } from "react";
import type { Resume, ResumeContent, ResumeSection, LastTailorSnapshot } from "@/types";

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
  const [tailorOpen, setTailorOpen] = useState(false);
  const [jobDescriptionForTailor, setJobDescriptionForTailor] = useState("");
  const [tailorResult, setTailorResult] = useState<{
    tailoredSummary?: string;
    keywords?: string[];
    bulletSuggestions?: string[];
  } | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [pendingTailorSnapshot, setPendingTailorSnapshot] = useState<LastTailorSnapshot | null>(null);
  const [showSnapshotDetail, setShowSnapshotDetail] = useState(false);

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ["resume"],
    queryFn: fetchResume,
  });

  const enterEditMode = useCallback((r: Resume | null, options?: { summaryOverride?: string }) => {
    if (r) {
      setTitle(r.title);
      const summary = r.content?.sections?.find((s) => s.type === "summary");
      setSummaryBody(options?.summaryOverride ?? summary?.body ?? "");
    } else {
      setTitle("My Resume");
      setSummaryBody(options?.summaryOverride ?? "");
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
      setPendingTailorSnapshot(null);
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

  const handleGetTailorSuggestions = async () => {
    if (!resume || !jobDescriptionForTailor.trim()) return;
    setIsTailoring(true);
    setTailorResult(null);
    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDescriptionForTailor.trim(),
          resumeContent: resume.content,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to get suggestions");
      setTailorResult(data.data);
    } catch (err) {
      toast.error("Could not get suggestions", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const handleApplyTailoredSummary = () => {
    if (tailorResult?.tailoredSummary && resume) {
      setPendingTailorSnapshot({
        keywords: tailorResult.keywords ?? [],
        tailoredSummary: tailorResult.tailoredSummary,
        bulletSuggestions: tailorResult.bulletSuggestions,
      });
      enterEditMode(resume, { summaryOverride: tailorResult.tailoredSummary });
      setTailorOpen(false);
      setTailorResult(null);
      setJobDescriptionForTailor("");
      toast.success("Summary applied. Save to keep the highlighted key points on your resume.");
    }
  };

  const handleCancelEdit = () => {
    if (resume) {
      setTitle(resume.title);
      const summary = resume.content?.sections?.find((s) => s.type === "summary");
      setSummaryBody(summary?.body ?? "");
    }
    setShowSnapshotDetail(false);
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

    const lastTailorSnapshot = pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot;
    updateMutation.mutate({
      id: resume.id,
      payload: {
        title: title || undefined,
        content: { ...resume.content, sections, lastTailorSnapshot },
      },
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
              {(pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot)?.keywords?.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Key points for this role</p>
                  <div className="flex flex-wrap gap-2">
                    {(pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot)!.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 text-xs font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSnapshotDetail((v) => !v)}
                    className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {showSnapshotDetail ? "Hide suggestion snapshot" : "View suggestion snapshot"}
                    {showSnapshotDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {showSnapshotDetail && (() => {
                    const snap = pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot;
                    if (!snap) return null;
                    return (
                      <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm space-y-2">
                        {snap.tailoredSummary && (
                          <div>
                            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Suggested summary applied</p>
                            <p className="text-[var(--foreground)] whitespace-pre-wrap">{snap.tailoredSummary}</p>
                          </div>
                        )}
                        {(snap.bulletSuggestions?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Bullet ideas</p>
                            <ul className="list-disc list-inside space-y-0.5 text-[var(--foreground)]">
                              {snap.bulletSuggestions!.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : null}
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
          {resume.content?.sections?.map((s) => {
            const snapshot = s.type === "summary" ? (resume.content?.lastTailorSnapshot) : undefined;
            return (
              <div key={s.id}>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{s.heading}</h3>
                {s.body && (
                  <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{s.body}</p>
                )}
                {snapshot?.keywords?.length ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Key points for this role</p>
                    <div className="flex flex-wrap gap-2">
                      {snapshot.keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 text-xs font-medium"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSnapshotDetail((v) => !v)}
                      className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <Info className="h-3.5 w-3.5" />
                      {showSnapshotDetail ? "Hide suggestion snapshot" : "View suggestion snapshot"}
                      {showSnapshotDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {showSnapshotDetail && (
                      <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm space-y-2">
                        {snapshot.tailoredSummary && (
                          <div>
                            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Suggested summary applied</p>
                            <p className="text-[var(--foreground)] whitespace-pre-wrap">{snapshot.tailoredSummary}</p>
                          </div>
                        )}
                        {(snapshot.bulletSuggestions?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Bullet ideas</p>
                            <ul className="list-disc list-inside space-y-0.5 text-[var(--foreground)]">
                              {snapshot.bulletSuggestions!.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          {(!resume.content?.sections?.length || sectionCount === 0) && (
            <p className="text-sm text-[var(--muted-foreground)]">No sections yet. Click Edit to add content.</p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setTailorOpen(true)}
          variant="outline"
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Tailor for a job
        </Button>
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

      <Dialog open={tailorOpen} onOpenChange={(open) => {
        setTailorOpen(open);
        if (!open) {
          setTailorResult(null);
          setJobDescriptionForTailor("");
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{tailorResult ? "Your suggestions" : "Tailor for a job"}</DialogTitle>
            <DialogDescription>
              {tailorResult
                ? "Review the tailored summary and keywords below. Apply to your resume or get new suggestions."
                : "Paste the job description below. We'll suggest a tailored summary and keywords."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-4">
            {tailorResult ? (
              <>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
                  <div className="p-4 space-y-4">
                    {tailorResult.tailoredSummary && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Suggested summary
                        </h4>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                          {tailorResult.tailoredSummary}
                        </p>
                      </div>
                    )}
                    {(tailorResult.keywords?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Keywords to include
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(tailorResult.keywords ?? []).map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 text-xs font-medium"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(tailorResult.bulletSuggestions?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Bullet ideas
                        </h4>
                        <ul className="space-y-1.5">
                          {(tailorResult.bulletSuggestions ?? []).map((b, i) => (
                            <li key={i} className="flex gap-2 text-sm text-[var(--foreground)]">
                              <span className="text-[var(--primary)] mt-0.5">•</span>
                              <span className="flex-1">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="tailor-jd">Job description</Label>
                <Textarea
                  id="tailor-jd"
                  placeholder="Paste the full job description here..."
                  value={jobDescriptionForTailor}
                  onChange={(e) => setJobDescriptionForTailor(e.target.value)}
                  rows={5}
                  className="resize-y max-h-[40vh]"
                />
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 flex flex-col gap-2 sm:flex-row px-6 pb-6 pt-2 border-t border-[var(--border)]">
            {tailorResult ? (
              <>
                {tailorResult.tailoredSummary && (
                  <Button onClick={handleApplyTailoredSummary} className="gap-2">
                    <Save className="h-4 w-4" />
                    Apply to summary
                  </Button>
                )}
                <Button variant="outline" onClick={() => setTailorResult(null)}>
                  Get new suggestions
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGetTailorSuggestions}
                disabled={isTailoring || !jobDescriptionForTailor.trim()}
                className="gap-2"
              >
                {isTailoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Get suggestions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
