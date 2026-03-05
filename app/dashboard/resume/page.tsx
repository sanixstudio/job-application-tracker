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
import { Loader2, Plus, FileText, Save, Download, Eye, Sparkles, Info, ChevronDown, ChevronUp, Trash2, Upload } from "lucide-react";
import { useState, useCallback, useRef, useMemo } from "react";
import type { Resume, ResumeContent, ResumeSection, LastTailorSnapshot } from "@/types";
import { scoreResume } from "@/lib/resume-score";

/** One work history entry for the Experience section. */
export interface ExperienceItem {
  company: string;
  title: string;
  dates: string;
  description: string;
}

/** One education entry. No AI tailoring — user-edited only. */
export interface EducationItem {
  school: string;
  degree: string;
  field: string;
  dates: string;
}

function getSection(resume: Resume | null, type: ResumeSection["type"]): ResumeSection | undefined {
  return resume?.content?.sections?.find((s) => s.type === type);
}

function sectionToExperienceItems(section: ResumeSection | undefined): ExperienceItem[] {
  if (!section?.items?.length) return [];
  return section.items.map((item) => ({
    company: (item.company ?? "").trim(),
    title: (item.title ?? "").trim(),
    dates: (item.dates ?? "").trim(),
    description: (item.description ?? item.bullets ?? "").trim(),
  }));
}

function experienceItemsToSectionItems(items: ExperienceItem[]): Array<Record<string, string>> {
  return items.map(({ company, title, dates, description }) => ({
    company,
    title,
    dates,
    description,
  }));
}

function sectionToEducationItems(section: ResumeSection | undefined): EducationItem[] {
  if (!section?.items?.length) return [];
  return section.items.map((item) => ({
    school: (item["school"] ?? "").trim(),
    degree: (item["degree"] ?? "").trim(),
    field: (item["field"] ?? "").trim(),
    dates: (item["dates"] ?? "").trim(),
  }));
}

function educationItemsToSectionItems(items: EducationItem[]): Array<Record<string, string>> {
  return items.map(({ school, degree, field, dates }) => ({
    school,
    degree,
    field,
    dates,
  }));
}

async function fetchResume(): Promise<Resume | null> {
  const res = await fetch("/api/resumes");
  const data = await res.json();
  if (res.status === 404) return null;
  if (!data.success) throw new Error(data.error || "Failed to fetch resume");
  return data.data;
}

async function createResume(payload?: { title?: string; content?: ResumeContent }): Promise<Resume> {
  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
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

type SectionType = "summary" | "skills" | "experience" | "education";

/** Score card shown at top so users can improve their resume and see the score update. */
function ResumeScoreCard({ score, feedback }: { score: number; feedback: string[] }) {
  return (
    <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-4 transition-all duration-200 hover:shadow-md">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Resume score</h3>
      <p className="text-2xl font-bold text-[var(--primary)] mb-2 tabular-nums">
        {score}/100
      </p>
      <p className="text-xs text-[var(--muted-foreground)] mb-2">
        Based on best practices: section completeness, STAR-style bullets, and quantifiable results. Make edits below to improve your score.
      </p>
      {feedback.length > 0 && (
        <ul className="text-sm text-[var(--foreground)] space-y-1 list-disc list-inside">
          {feedback.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ResumePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  /** When set, only this section shows inline edit; others stay in view mode. */
  const [editingSection, setEditingSection] = useState<SectionType | null>(null);
  const [title, setTitle] = useState("");
  const [summaryBody, setSummaryBody] = useState("");
  const [skillsBody, setSkillsBody] = useState("");
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>([]);
  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [parsedScore, setParsedScore] = useState<number | null>(null);
  const [parsedFeedback, setParsedFeedback] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [jobDescriptionForTailor, setJobDescriptionForTailor] = useState("");
  const [tailorResult, setTailorResult] = useState<{
    tailoredSummary?: string;
    keywords?: string[];
    bulletSuggestions?: string[];
    suggestedSkills?: string[];
  } | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [pendingTailorSnapshot, setPendingTailorSnapshot] = useState<LastTailorSnapshot | null>(null);
  const [showSnapshotDetail, setShowSnapshotDetail] = useState(false);

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ["resume"],
    queryFn: fetchResume,
  });

  const enterEditMode = useCallback((
    r: Resume | null,
    options?: { summaryOverride?: string; skillsOverride?: string; experienceAppendBullets?: string[] }
  ) => {
    if (r) {
      setTitle(r.title);
      const summary = getSection(r, "summary");
      setSummaryBody(options?.summaryOverride ?? summary?.body ?? "");
      const skills = getSection(r, "skills");
      setSkillsBody(options?.skillsOverride ?? skills?.body ?? "");
      const items = sectionToExperienceItems(getSection(r, "experience"));
      if (options?.experienceAppendBullets?.length) {
        const bulletText = options.experienceAppendBullets.map((b) => (b.startsWith("•") ? b : `• ${b}`)).join("\n");
        if (items.length > 0) {
          setExperienceItems(items.map((it, i) =>
            i === 0 ? { ...it, description: it.description ? `${it.description}\n${bulletText}` : bulletText } : it
          ));
        } else {
          setExperienceItems([{ company: "Relevant experience", title: "", dates: "", description: bulletText }]);
        }
      } else {
        setExperienceItems(items.length ? items : [{ company: "", title: "", dates: "", description: "" }]);
      }
      const edu = sectionToEducationItems(getSection(r, "education"));
      setEducationItems(edu.length ? edu : [{ school: "", degree: "", field: "", dates: "" }]);
    } else {
      setTitle("My Resume");
      setSummaryBody(options?.summaryOverride ?? "");
      setSkillsBody(options?.skillsOverride ?? "");
      setExperienceItems(options?.experienceAppendBullets?.length
        ? [{ company: "Relevant experience", title: "", dates: "", description: options.experienceAppendBullets.map((b) => `• ${b}`).join("\n") }]
        : [{ company: "", title: "", dates: "", description: "" }]);
      setEducationItems([{ school: "", degree: "", field: "", dates: "" }]);
    }
    setIsEditing(true);
  }, []);

  /** Open inline edit for a single section; syncs that section's state from resume (or options). */
  const enterSectionEdit = useCallback((
    r: Resume | null,
    sectionType: SectionType,
    options?: { summaryOverride?: string; skillsOverride?: string; experienceAppendBullets?: string[] }
  ) => {
    if (!r) return;
    if (sectionType === "summary") {
      setSummaryBody(options?.summaryOverride ?? getSection(r, "summary")?.body ?? "");
    }
    if (sectionType === "skills") {
      setSkillsBody(options?.skillsOverride ?? getSection(r, "skills")?.body ?? "");
    }
    if (sectionType === "experience") {
      const items = sectionToExperienceItems(getSection(r, "experience"));
      if (options?.experienceAppendBullets?.length) {
        const bulletText = options.experienceAppendBullets.map((b) => (b.startsWith("•") ? b : `• ${b}`)).join("\n");
        if (items.length > 0) {
          setExperienceItems(items.map((it, i) =>
            i === 0 ? { ...it, description: it.description ? `${it.description}\n${bulletText}` : bulletText } : it
          ));
        } else {
          setExperienceItems([{ company: "Relevant experience", title: "", dates: "", description: bulletText }]);
        }
      } else {
        setExperienceItems(items.length ? items : [{ company: "", title: "", dates: "", description: "" }]);
      }
    }
    if (sectionType === "education") {
      const edu = sectionToEducationItems(getSection(r, "education"));
      setEducationItems(edu.length ? edu : [{ school: "", degree: "", field: "", dates: "" }]);
    }
    setEditingSection(sectionType);
  }, []);

  const handleCancelSectionEdit = useCallback((r: Resume | null, sectionType: SectionType) => {
    if (r) {
      if (sectionType === "summary") setSummaryBody(getSection(r, "summary")?.body ?? "");
      if (sectionType === "skills") setSkillsBody(getSection(r, "skills")?.body ?? "");
      if (sectionType === "experience") setExperienceItems(sectionToExperienceItems(getSection(r, "experience")) || [{ company: "", title: "", dates: "", description: "" }]);
      if (sectionType === "education") setEducationItems(sectionToEducationItems(getSection(r, "education")) || [{ school: "", degree: "", field: "", dates: "" }]);
    }
    setEditingSection(null);
  }, []);

  const handleSaveSection = (sectionType: SectionType) => {
    if (!resume) return;
    let sections: ResumeSection[] = [...(resume.content?.sections ?? [])];

    if (sectionType === "summary") {
      sections = upsertSection(sections, {
        id: getSection(resume, "summary")?.id ?? crypto.randomUUID(),
        type: "summary",
        heading: "Summary",
        body: summaryBody,
      });
    }
    if (sectionType === "skills") {
      sections = upsertSection(sections, {
        id: getSection(resume, "skills")?.id ?? crypto.randomUUID(),
        type: "skills",
        heading: "Skills",
        body: skillsBody,
      });
    }
    if (sectionType === "experience") {
      sections = upsertSection(sections, {
        id: getSection(resume, "experience")?.id ?? crypto.randomUUID(),
        type: "experience",
        heading: "Experience",
        items: experienceItemsToSectionItems(experienceItems.filter((e) => e.company || e.title || e.dates || e.description)),
      });
    }
    if (sectionType === "education") {
      const educationFiltered = educationItems.filter((e) => e.school || e.degree || e.field || e.dates);
      if (educationFiltered.length > 0) {
        sections = upsertSection(sections, {
          id: getSection(resume, "education")?.id ?? crypto.randomUUID(),
          type: "education",
          heading: "Education",
          items: educationItemsToSectionItems(educationFiltered),
        });
      } else {
        sections = sections.filter((s) => s.type !== "education");
      }
    }

    updateMutation.mutate(
      {
        id: resume.id,
        payload: {
          content: { ...resume.content, sections, lastTailorSnapshot: pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot },
        },
      },
      {
        onSuccess: () => {
          setEditingSection(null);
        },
      }
    );
  };

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
      setParsedScore(null);
      setParsedFeedback([]);
      toast.success("Resume saved");
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error("Could not save resume", { description: err.message });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(undefined);
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

  const handlePreviewPdf = async () => {
    if (!resume) return;
    setIsPreviewingPdf(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/export?format=pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const previewWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (previewWindow) {
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      } else {
        URL.revokeObjectURL(url);
        toast.error("Preview blocked", {
          description: "Allow pop-ups for this site to preview the PDF.",
        });
      }
    } catch (err) {
      toast.error("Could not preview PDF", {
        description: err instanceof Error ? err.message : "Export failed",
      });
    } finally {
      setIsPreviewingPdf(false);
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
      enterSectionEdit(resume, "summary", { summaryOverride: tailorResult.tailoredSummary });
      setTailorOpen(false);
      setTailorResult(null);
      setJobDescriptionForTailor("");
      toast.success("Summary applied. Save to keep the highlighted key points on your resume.");
    }
  };

  const handleCancelEdit = () => {
    if (resume) {
      setTitle(resume.title);
      setSummaryBody(getSection(resume, "summary")?.body ?? "");
      setSkillsBody(getSection(resume, "skills")?.body ?? "");
      setExperienceItems(sectionToExperienceItems(getSection(resume, "experience")) || [{ company: "", title: "", dates: "", description: "" }]);
      setEducationItems(sectionToEducationItems(getSection(resume, "education")) || [{ school: "", degree: "", field: "", dates: "" }]);
    }
    setShowSnapshotDetail(false);
    setParsedScore(null);
    setParsedFeedback([]);
    setIsEditing(false);
  };

  /** Apply parsed resume content to form state and enter edit mode (for upload flow). */
  const applyParsedContentToForm = useCallback((content: ResumeContent, existingTitle?: string) => {
    const fakeResume: Resume = {
      id: "",
      userId: "",
      title: existingTitle ?? "My Resume",
      content: content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTitle(fakeResume.title);
    setSummaryBody(getSection(fakeResume, "summary")?.body ?? "");
    setSkillsBody(getSection(fakeResume, "skills")?.body ?? "");
    const expItems = sectionToExperienceItems(getSection(fakeResume, "experience"));
    setExperienceItems(expItems.length ? expItems : [{ company: "", title: "", dates: "", description: "" }]);
    const eduItems = sectionToEducationItems(getSection(fakeResume, "education"));
    setEducationItems(eduItems.length ? eduItems : [{ school: "", degree: "", field: "", dates: "" }]);
    setIsEditing(true);
  }, []);

  const handleUploadResume = useCallback(async (file: File) => {
    setIsUploadingResume(true);
    setParsedScore(null);
    setParsedFeedback([]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resumes/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Parse failed");
      const { content, score, feedback } = data.data;
      setParsedScore(score);
      setParsedFeedback(Array.isArray(feedback) ? feedback : []);

      if (!resume) {
        createMutation.mutate({ content });
        toast.success("Resume imported. Review the sections and save any changes.");
      } else {
        applyParsedContentToForm(content, resume.title);
        toast.success("Resume parsed. Review the sections below and click Save to keep changes.");
      }
    } catch (err) {
      toast.error("Could not parse resume", {
        description: err instanceof Error ? err.message : "Use a PDF or DOCX file with selectable text.",
      });
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [resume, createMutation, queryClient, enterEditMode, applyParsedContentToForm]);

  const upsertSection = (sections: ResumeSection[], section: ResumeSection): ResumeSection[] => {
    const idx = sections.findIndex((s) => s.type === section.type);
    const next = [...sections];
    if (idx >= 0) next[idx] = section;
    else next.push(section);
    return next;
  };

  /** Build ResumeContent from current form state for live scoring in edit mode. */
  const contentFromFormState = useMemo((): ResumeContent => {
    const sections: ResumeSection[] = [];
    sections.push({ id: "summary", type: "summary", heading: "Summary", body: summaryBody });
    sections.push({ id: "skills", type: "skills", heading: "Skills", body: skillsBody });
    sections.push({
      id: "experience",
      type: "experience",
      heading: "Experience",
      items: experienceItemsToSectionItems(experienceItems.filter((e) => e.company || e.title || e.dates || e.description)),
    });
    const educationFiltered = educationItems.filter((e) => e.school || e.degree || e.field || e.dates);
    if (educationFiltered.length > 0) {
      sections.push({
        id: "education",
        type: "education",
        heading: "Education",
        items: educationItemsToSectionItems(educationFiltered),
      });
    }
    return { sections };
  }, [summaryBody, skillsBody, experienceItems, educationItems]);

  /** Live resume score from current content (saved in view mode, form state in edit mode). */
  const liveScoreResult = useMemo(() => {
    const content = isEditing ? contentFromFormState : (resume?.content ?? { sections: [] });
    return scoreResume(content);
  }, [isEditing, contentFromFormState, resume?.content]);

  const handleSave = () => {
    if (!resume) return;
    let sections: ResumeSection[] = [...(resume.content?.sections ?? [])];

    const summarySection: ResumeSection = {
      id: getSection(resume, "summary")?.id ?? crypto.randomUUID(),
      type: "summary",
      heading: "Summary",
      body: summaryBody,
    };
    sections = upsertSection(sections, summarySection);

    const skillsSection: ResumeSection = {
      id: getSection(resume, "skills")?.id ?? crypto.randomUUID(),
      type: "skills",
      heading: "Skills",
      body: skillsBody,
    };
    sections = upsertSection(sections, skillsSection);

    const experienceSection: ResumeSection = {
      id: getSection(resume, "experience")?.id ?? crypto.randomUUID(),
      type: "experience",
      heading: "Experience",
      items: experienceItemsToSectionItems(experienceItems.filter((e) => e.company || e.title || e.dates || e.description)),
    };
    sections = upsertSection(sections, experienceSection);

    const educationFiltered = educationItems.filter((e) => e.school || e.degree || e.field || e.dates);
    if (educationFiltered.length > 0) {
      const educationSection: ResumeSection = {
        id: getSection(resume, "education")?.id ?? crypto.randomUUID(),
        type: "education",
        heading: "Education",
        items: educationItemsToSectionItems(educationFiltered),
      };
      sections = upsertSection(sections, educationSection);
    } else {
      sections = sections.filter((s) => s.type !== "education");
    }

    const lastTailorSnapshot = pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot;
    updateMutation.mutate({
      id: resume.id,
      payload: {
        title: title || undefined,
        content: { ...resume.content, sections, lastTailorSnapshot },
      },
    });
  };

  const handleApplyTailoredSkills = () => {
    if (tailorResult?.suggestedSkills?.length && resume) {
      enterSectionEdit(resume, "skills", { skillsOverride: tailorResult.suggestedSkills.join(", ") });
      setTailorOpen(false);
      setTailorResult(null);
      setJobDescriptionForTailor("");
      toast.success("Skills applied. Save to keep changes.");
    }
  };

  const handleAddBulletsToExperience = () => {
    if (tailorResult?.bulletSuggestions?.length && resume) {
      enterSectionEdit(resume, "experience", { experienceAppendBullets: tailorResult.bulletSuggestions });
      setTailorOpen(false);
      setTailorResult(null);
      setJobDescriptionForTailor("");
      toast.success("Bullets added to experience. Review and save.");
    }
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
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
            Upload your existing resume (PDF or DOCX) to import sections, or create one from scratch.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadResume(file);
            }}
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingResume}
              variant="default"
              size="lg"
              className="gap-2"
            >
              {isUploadingResume ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload resume
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || isUploadingResume}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create from scratch
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const sectionCount = resume.content?.sections?.length ?? 0;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <ResumeScoreCard score={liveScoreResult.score} feedback={liveScoreResult.feedback} />
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
            <div className="space-y-2">
              <Label htmlFor="resume-skills">Skills</Label>
              <Textarea
                id="resume-skills"
                value={skillsBody}
                onChange={(e) => setSkillsBody(e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js (comma or newline separated)"
                rows={2}
                className="resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label>Experience (work history)</Label>
              <p className="text-xs text-[var(--muted-foreground)]">Add jobs with company, title, dates, and bullet points.</p>
              {experienceItems.map((job, idx) => (
                <div key={idx} className="rounded-lg border border-[var(--border)] p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Company"
                      value={job.company}
                      onChange={(e) =>
                        setExperienceItems((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, company: e.target.value } : p))
                        )
                      }
                    />
                    <Input
                      placeholder="Job title"
                      value={job.title}
                      onChange={(e) =>
                        setExperienceItems((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p))
                        )
                      }
                    />
                    <Input
                      placeholder="Dates (e.g. 2020 – 2023)"
                      value={job.dates}
                      onChange={(e) =>
                        setExperienceItems((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p))
                        )
                      }
                    />
                  </div>
                  <Textarea
                    placeholder="Bullet points (one per line)"
                    value={job.description}
                    onChange={(e) =>
                      setExperienceItems((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p))
                      )
                    }
                    rows={3}
                    className="resize-y"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[var(--destructive)]"
                      onClick={() => setExperienceItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setExperienceItems((prev) => [...prev, { company: "", title: "", dates: "", description: "" }])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add job
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Education (optional)</Label>
              <p className="text-xs text-[var(--muted-foreground)]">No AI tailoring — edit manually.</p>
              {educationItems.map((edu, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`edu-school-${idx}`} className="text-xs">School</Label>
                      <Input
                        id={`edu-school-${idx}`}
                        value={edu.school}
                        onChange={(e) =>
                          setEducationItems((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, school: e.target.value } : p))
                          )
                        }
                        placeholder="University name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edu-dates-${idx}`} className="text-xs">Dates</Label>
                      <Input
                        id={`edu-dates-${idx}`}
                        value={edu.dates}
                        onChange={(e) =>
                          setEducationItems((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p))
                          )
                        }
                        placeholder="e.g. 2015 – 2019"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`edu-degree-${idx}`} className="text-xs">Degree</Label>
                      <Input
                        id={`edu-degree-${idx}`}
                        value={edu.degree}
                        onChange={(e) =>
                          setEducationItems((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, degree: e.target.value } : p))
                          )
                        }
                        placeholder="e.g. B.S., M.A."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edu-field-${idx}`} className="text-xs">Field of study</Label>
                      <Input
                        id={`edu-field-${idx}`}
                        value={edu.field}
                        onChange={(e) =>
                          setEducationItems((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, field: e.target.value } : p))
                          )
                        }
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[var(--destructive)]"
                      onClick={() => setEducationItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setEducationItems((prev) => [...prev, { school: "", degree: "", field: "", dates: "" }])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add education
              </Button>
            </div>
            <div className="space-y-2 pt-2">
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
      <ResumeScoreCard score={liveScoreResult.score} feedback={liveScoreResult.feedback} />
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
        <CardContent className="space-y-6">
          {(["summary", "skills", "experience", "education"] as const).map((sectionType) => {
            const s = getSection(resume, sectionType) ?? {
              id: "",
              type: sectionType,
              heading: sectionType === "summary" ? "Summary" : sectionType === "skills" ? "Skills" : sectionType === "experience" ? "Experience" : "Education",
              body: "",
              items: [],
            };
            const snapshot = sectionType === "summary" ? resume.content?.lastTailorSnapshot : undefined;
            const hasContent = s.body || (s.items?.length ?? 0) > 0;
            const showTailor = sectionType !== "education";
            const isEditingThisSection = editingSection === sectionType;

            return (
              <div key={s.id || sectionType} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{s.heading}</h3>

                {isEditingThisSection ? (
                  <>
                    {sectionType === "summary" && (
                      <div className="space-y-2">
                        <Label htmlFor="inline-summary" className="sr-only">Summary</Label>
                        <Textarea id="inline-summary" value={summaryBody} onChange={(e) => setSummaryBody(e.target.value)} placeholder="Brief professional summary..." rows={4} className="resize-y" />
                      </div>
                    )}
                    {sectionType === "skills" && (
                      <div className="space-y-2">
                        <Label htmlFor="inline-skills" className="sr-only">Skills</Label>
                        <Textarea id="inline-skills" value={skillsBody} onChange={(e) => setSkillsBody(e.target.value)} placeholder="e.g. React, TypeScript (comma or newline separated)" rows={2} className="resize-y" />
                      </div>
                    )}
                    {sectionType === "experience" && (
                      <div className="space-y-2">
                        {experienceItems.map((job, idx) => (
                          <div key={idx} className="rounded-lg border border-[var(--border)] p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Input placeholder="Company" value={job.company} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, company: e.target.value } : p)))} />
                              <Input placeholder="Job title" value={job.title} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)))} />
                              <Input placeholder="Dates" value={job.dates} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p)))} />
                            </div>
                            <Textarea placeholder="Bullet points (one per line)" value={job.description} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))} rows={2} className="resize-y" />
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => setExperienceItems((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setExperienceItems((prev) => [...prev, { company: "", title: "", dates: "", description: "" }])}><Plus className="h-4 w-4 mr-1" /> Add job</Button>
                      </div>
                    )}
                    {sectionType === "education" && (
                      <div className="space-y-2">
                        {educationItems.map((edu, idx) => (
                          <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1"><Label className="text-xs">School</Label><Input value={edu.school} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, school: e.target.value } : p)))} placeholder="University name" /></div>
                              <div className="space-y-1"><Label className="text-xs">Dates</Label><Input value={edu.dates} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p)))} placeholder="e.g. 2015 – 2019" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1"><Label className="text-xs">Degree</Label><Input value={edu.degree} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, degree: e.target.value } : p)))} placeholder="e.g. B.S., M.A." /></div>
                              <div className="space-y-1"><Label className="text-xs">Field of study</Label><Input value={edu.field} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, field: e.target.value } : p)))} placeholder="e.g. Computer Science" /></div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-[var(--destructive)]" onClick={() => setEducationItems((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setEducationItems((prev) => [...prev, { school: "", degree: "", field: "", dates: "" }])}><Plus className="h-4 w-4 mr-1" /> Add education</Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                      <Button onClick={() => handleSaveSection(sectionType)} disabled={updateMutation.isPending} size="sm" className="gap-1">
                        {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCancelSectionEdit(resume, sectionType)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                {sectionType === "summary" && (
                  <>
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
                  </>
                )}

                {sectionType === "skills" && (
                  <>
                    {s.body ? (
                      <div className="flex flex-wrap gap-2">
                        {s.body.split(/[\n,]+/).map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-[var(--muted)] text-[var(--foreground)] px-3 py-1 text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)] italic">No skills added yet.</p>
                    )}
                  </>
                )}

                {sectionType === "experience" && (
                  <>
                    {s.items?.length ? (
                      <div className="space-y-4">
                        {s.items.map((item, idx) => {
                          const company = item["company"] ?? "";
                          const title = item["title"] ?? "";
                          const dates = item["dates"] ?? "";
                          const description = item["description"] ?? item["bullets"] ?? "";
                          return (
                            <div key={idx}>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {(title || company) && (
                                  <span>{[title, company].filter(Boolean).join(" at ")}</span>
                                )}
                                {dates && (
                                  <span className="text-[var(--muted-foreground)] font-normal ml-1">· {dates}</span>
                                )}
                              </p>
                              {description && (
                                <ul className="mt-1 list-disc list-inside text-sm text-[var(--muted-foreground)] space-y-0.5">
                                  {description
                                    .split(/\r?\n/)
                                    .filter((l) => l.trim())
                                    .map((line, i) => (
                                      <li key={i}>{line.replace(/^[•\-]\s*/, "").trim()}</li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)] italic">No experience entries yet.</p>
                    )}
                  </>
                )}

                {sectionType === "education" && (
                  <>
                    {s.items?.length ? (
                      <div className="space-y-3">
                        {s.items.map((item, idx) => {
                          const school = item["school"] ?? "";
                          const degree = item["degree"] ?? "";
                          const field = item["field"] ?? "";
                          const dates = item["dates"] ?? "";
                          const degreeLine = [degree, field].filter(Boolean).join(" in ");
                          const parts = [school, degreeLine, dates].filter(Boolean);
                          return (
                            <div key={idx}>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {parts.join(" · ")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)] italic">No education added yet.</p>
                    )}
                  </>
                )}

                {!hasContent && sectionType !== "summary" && (
                  <p className="text-sm text-[var(--muted-foreground)] italic">Click Edit to add content.</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
                  {showTailor && (
                    <Button onClick={() => setTailorOpen(true)} variant="outline" size="sm" className="gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Tailor for a job
                    </Button>
                  )}
                  <Button onClick={() => enterSectionEdit(resume, sectionType)} variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadResume(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingResume}
          variant="outline"
          className="gap-2"
        >
          {isUploadingResume ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Import from file
        </Button>
        <Button
          onClick={handlePreviewPdf}
          disabled={isPreviewingPdf || isExportingPdf}
          variant="outline"
          className="gap-2"
        >
          {isPreviewingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Preview
        </Button>
        <Button
          onClick={handleDownloadPdf}
          disabled={isExportingPdf || isPreviewingPdf}
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
                    {(tailorResult.suggestedSkills?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Suggested skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(tailorResult.suggestedSkills ?? []).map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center rounded-full bg-[var(--muted)] text-[var(--foreground)] px-3 py-1 text-xs font-medium"
                            >
                              {sk}
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
          <DialogFooter className="shrink-0 flex flex-col gap-2 sm:flex-row flex-wrap px-6 pb-6 pt-2 border-t border-[var(--border)]">
            {tailorResult ? (
              <>
                {tailorResult.tailoredSummary && (
                  <Button onClick={handleApplyTailoredSummary} className="gap-2">
                    <Save className="h-4 w-4" />
                    Apply to summary
                  </Button>
                )}
                {(tailorResult.suggestedSkills?.length ?? 0) > 0 && (
                  <Button onClick={handleApplyTailoredSkills} variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    Apply to skills
                  </Button>
                )}
                {(tailorResult.bulletSuggestions?.length ?? 0) > 0 && (
                  <Button onClick={handleAddBulletsToExperience} variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    Add bullets to experience
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
