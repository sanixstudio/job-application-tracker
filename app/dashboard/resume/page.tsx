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
import { Loader2, Plus, FileText, Save, Download, Eye, Sparkles, Info, ChevronDown, ChevronUp, ChevronRight, Trash2, Upload, Trophy, TrendingUp, AlertCircle, Lightbulb, Briefcase, GraduationCap, AlignLeft, Wrench, AlertTriangle } from "lucide-react";
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

const FEEDBACK_PREVIEW_COUNT = 3;

/** Stylish resume score card: circular gauge, band badge, expandable tips. */
function ResumeScoreCard({ score, feedback }: { score: number; feedback: string[] }) {
  const [showAllTips, setShowAllTips] = useState(false);
  const scoreBand = score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  const scoreLabel = scoreBand === "high" ? "Strong" : scoreBand === "mid" ? "Good start" : "Needs work";
  const BandIcon = scoreBand === "high" ? Trophy : scoreBand === "mid" ? TrendingUp : AlertCircle;

  const ringColor =
    scoreBand === "high"
      ? "var(--primary)"
      : scoreBand === "low"
        ? "var(--destructive)"
        : "var(--chart-2)";
  const bandBg =
    scoreBand === "high"
      ? "bg-(--primary)/10 text-(--primary)"
      : scoreBand === "low"
        ? "bg-(--destructive)/10 text-(--destructive)"
        : "bg-(--accent) text-(--accent-foreground)";
  const borderAccent =
    scoreBand === "high"
      ? "border-(--primary)/20"
      : scoreBand === "low"
        ? "border-(--destructive)/20"
        : "border-(--chart-2)/20";
  const cardGradient =
    scoreBand === "high"
      ? "bg-gradient-to-b from-(--primary)/5 to-transparent"
      : scoreBand === "low"
        ? "bg-gradient-to-b from-(--destructive)/5 to-transparent"
        : "";

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference * (1 - score / 100);

  const visibleFeedback = showAllTips ? feedback : feedback.slice(0, FEEDBACK_PREVIEW_COUNT);
  const hasMoreTips = feedback.length > FEEDBACK_PREVIEW_COUNT && !showAllTips;

  return (
    <Card
      className={`rounded-2xl border-2 ${borderAccent} bg-(--card) shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${cardGradient}`}
      aria-live="polite"
      aria-label={`Resume score: ${score} out of 100, ${scoreLabel}`}
    >
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Circular score gauge */}
          <div className="flex shrink-0 justify-center sm:justify-start">
            <div className="relative" style={{ width: 100, height: 100 }}>
              <svg
                className="-rotate-90 size-full"
                viewBox="0 0 100 100"
                aria-hidden
              >
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="8"
                  className="transition-opacity"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-(--foreground) leading-none">
                  {score}
                </span>
                <span className="text-[10px] font-medium text-(--muted-foreground) mt-0.5">out of 100</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${bandBg}`}>
              <BandIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {scoreLabel}
            </div>
            <p className="text-sm text-(--muted-foreground) leading-relaxed">
              Based on completeness, STAR-style bullets, and quantifiable results. Edit sections below to improve.
            </p>
          </div>
        </div>

        {/* Tips to improve */}
        {feedback.length > 0 && (
          <div className="mt-6 pt-5 border-t border-(--border)">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-(--foreground) mb-3">
              <Lightbulb className="h-4 w-4 text-(--primary)" aria-hidden />
              Tips to improve
            </h4>
            <ul className="space-y-2.5" role="list">
              {visibleFeedback.map((f, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-(--foreground) leading-snug"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-(--primary)/60" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {hasMoreTips && (
              <button
                type="button"
                onClick={() => setShowAllTips(true)}
                className="mt-3 text-xs font-medium text-(--primary) hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 rounded"
              >
                Show {feedback.length - FEEDBACK_PREVIEW_COUNT} more tips
              </button>
            )}
          </div>
        )}
      </div>
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
  /** View mode: which sections are expanded. Default all true. */
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    summary: true,
    skills: true,
    experience: true,
    education: true,
  });
  const toggleSection = (key: string) =>
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));

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
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/resumes/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Parse failed");
      const { content } = data.data;

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
  }, [resume, createMutation, applyParsedContentToForm]);

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
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Resume</h1>
        </header>
        <Card className="rounded-2xl border-2 border-(--border) bg-(--card) bg-gradient-to-b from-(--primary)/5 to-transparent shadow-lg overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 gap-5" aria-live="polite">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-(--primary)/10">
              <Loader2 className="h-7 w-7 animate-spin text-(--primary)" aria-hidden />
            </div>
            <p className="text-sm font-medium text-(--muted-foreground)">Loading resume…</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Resume</h1>
        </header>
        <Card className="rounded-2xl border-2 border-(--destructive)/20 bg-(--card) bg-gradient-to-b from-(--destructive)/5 to-transparent shadow-lg overflow-hidden">
          <div className="p-6 flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--destructive)/10">
              <AlertTriangle className="h-6 w-6 text-(--destructive)" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-(--foreground)">Couldn’t load resume</h3>
              <p className="mt-1 text-sm text-(--destructive)" role="alert">
                {String(error)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Resume</h1>
          <p className="mt-1 text-sm text-(--muted-foreground) max-w-xl">
            Create your resume to export as PDF or tailor it per job later.
          </p>
        </header>
        <Card className="rounded-2xl border-2 border-(--primary)/20 bg-(--card) bg-gradient-to-b from-(--primary)/5 to-transparent p-10 sm:p-14 text-center shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-(--primary)/10 text-(--primary)">
            <FileText className="size-10" strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-(--foreground)">No resume yet</h2>
          <p className="mt-2 text-sm text-(--muted-foreground) max-w-sm mx-auto leading-relaxed">
            Upload a PDF or DOCX to import sections, or start from scratch.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadResume(file);
            }}
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingResume}
              size="lg"
              className="gap-2"
            >
              {isUploadingResume ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
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
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
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
      <>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 pb-24">
          <div className="min-w-0 space-y-6">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Edit resume</h1>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                Update your title and sections. Save when ready.
              </p>
            </header>
            <div className="lg:hidden">
              <ResumeScoreCard score={liveScoreResult.score} feedback={liveScoreResult.feedback} />
            </div>
            <Card className="rounded-2xl border-2 border-(--border) bg-(--card) bg-gradient-to-b from-(--primary)/[0.03] to-transparent shadow-lg overflow-hidden">
          <div className="p-6 sm:p-7 space-y-8">
            <section className="space-y-2 rounded-xl p-4 bg-(--card) border border-(--border)/60" aria-labelledby="resume-title-label">
              <Label id="resume-title-label" htmlFor="resume-title" className="flex items-center gap-2 text-sm font-semibold text-(--foreground)">
                <FileText className="h-4 w-4 text-(--primary)" aria-hidden /> Title
              </Label>
              <Input
                id="resume-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Resume"
                className="max-w-md"
                aria-describedby="resume-title-hint"
              />
              <p id="resume-title-hint" className="text-xs text-(--muted-foreground)">Shown at the top of your resume.</p>
            </section>

            <section className="space-y-2 rounded-xl p-4 bg-(--card) border border-(--border)/60" aria-labelledby="resume-summary-label">
              <Label id="resume-summary-label" htmlFor="resume-summary" className="flex items-center gap-2 text-sm font-semibold text-(--foreground)">
                <AlignLeft className="h-4 w-4 text-(--primary)" aria-hidden /> Summary
              </Label>
              <Textarea
                id="resume-summary"
                value={summaryBody}
                onChange={(e) => setSummaryBody(e.target.value)}
                placeholder="Brief professional summary (2–4 sentences)."
                rows={4}
                className="resize-y min-h-24"
              />
            </section>

            <section className="space-y-2 rounded-xl p-4 bg-(--card) border border-(--border)/60" aria-labelledby="resume-skills-label">
              <Label id="resume-skills-label" htmlFor="resume-skills" className="flex items-center gap-2 text-sm font-semibold text-(--foreground)">
                <Wrench className="h-4 w-4 text-(--primary)" aria-hidden /> Skills
              </Label>
              <Textarea
                id="resume-skills"
                value={skillsBody}
                onChange={(e) => setSkillsBody(e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js (comma or newline separated)"
                rows={2}
                className="resize-y"
                aria-describedby="resume-skills-hint"
              />
              <p id="resume-skills-hint" className="text-xs text-(--muted-foreground)">List skills recruiters and ATS look for.</p>
            </section>

            <section className="space-y-3 rounded-xl p-4 bg-(--card) border border-(--border)/60" aria-labelledby="experience-label">
              <div>
                <Label id="experience-label" className="flex items-center gap-2 text-sm font-semibold text-(--foreground)">
                  <Briefcase className="h-4 w-4 text-(--primary)" aria-hidden /> Experience
                </Label>
                <p id="experience-hint" className="text-xs text-(--muted-foreground) mt-0.5">Company, job title, dates, and bullet points. Use numbers and outcomes where possible.</p>
              </div>
              {experienceItems.map((job, idx) => (
                <div key={idx} className="rounded-xl border-2 border-(--border)/60 bg-(--card) p-4 space-y-3 shadow-sm">
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
                      className="text-(--destructive)"
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
            </section>

            <section className="space-y-3 rounded-xl p-4 bg-(--card) border border-(--border)/60" aria-labelledby="education-label">
              <div>
                <Label id="education-label" className="flex items-center gap-2 text-sm font-semibold text-(--foreground)">
                  <GraduationCap className="h-4 w-4 text-(--primary)" aria-hidden /> Education (optional)
                </Label>
                <p id="education-hint" className="text-xs text-(--muted-foreground) mt-0.5">Edit manually; not used for AI tailoring.</p>
              </div>
              {educationItems.map((edu, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-(--border)/60 bg-(--muted)/20 p-4 space-y-2 shadow-sm"
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
                      className="text-(--destructive)"
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
            </section>

            {(pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot)?.keywords?.length ? (
                <div className="mt-6 rounded-xl border-2 border-(--primary)/20 bg-gradient-to-b from-(--primary)/5 to-transparent p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">Key points for this role</p>
                  <div className="flex flex-wrap gap-2">
                    {(pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot)!.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center rounded-full bg-(--primary)/10 text-(--primary) px-3 py-1.5 text-xs font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSnapshotDetail((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground) rounded-md focus-visible:ring-2 focus-visible:ring-(--ring)"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {showSnapshotDetail ? "Hide suggestion snapshot" : "View suggestion snapshot"}
                    {showSnapshotDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {showSnapshotDetail && (() => {
                    const snap = pendingTailorSnapshot ?? resume.content?.lastTailorSnapshot;
                    if (!snap) return null;
                    return (
                      <div className="mt-2 rounded-xl border border-(--border) bg-(--card) p-4 text-sm space-y-3 shadow-sm">
                        {snap.tailoredSummary && (
                          <div>
                            <p className="text-xs font-medium text-(--muted-foreground) mb-1">Suggested summary applied</p>
                            <p className="text-(--foreground) whitespace-pre-wrap">{snap.tailoredSummary}</p>
                          </div>
                        )}
                        {(snap.bulletSuggestions?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-xs font-medium text-(--muted-foreground) mb-1">Bullet ideas</p>
                            <ul className="list-disc list-inside space-y-0.5 text-(--foreground)">
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
        </Card>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <ResumeScoreCard score={liveScoreResult.score} feedback={liveScoreResult.feedback} />
            </div>
          </aside>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-(--border) bg-(--card)/95 backdrop-blur supports-backdrop-filter:bg-(--card)/80 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="text-sm font-medium text-(--muted-foreground) hidden sm:block">
              Unsaved changes
            </p>
            <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit} size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                size="sm"
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                Save resume
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
      <>
        <div className="space-y-8 pb-24">
          <ResumeScoreCard score={liveScoreResult.score} feedback={liveScoreResult.feedback} />
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-(--foreground)">Resume</h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {resume.title} · {sectionCount} section{sectionCount !== 1 ? "s" : ""}
            </p>
          </header>
          <Card className="rounded-2xl border-2 border-(--border) bg-(--card) bg-gradient-to-b from-(--primary)/[0.03] to-transparent shadow-lg overflow-hidden">
            <CardHeader className="pb-5 border-b-2 border-(--border) px-6 pt-6">
              <CardTitle className="text-lg font-semibold text-(--foreground)">{resume.title}</CardTitle>
              <CardDescription className="text-(--muted-foreground) mt-0.5">
                Review and edit sections below, or export as PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
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
            const isOpen = sectionOpen[sectionType] !== false;
            const preview =
              !isOpen && sectionType === "summary" && s.body
                ? s.body.slice(0, 50).trim() + (s.body.length > 50 ? "…" : "")
                : !isOpen && sectionType === "skills" && s.body
                  ? `${s.body.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean).length} skills`
                  : !isOpen && sectionType === "experience" && (s.items?.length ?? 0) > 0
                    ? `${s.items!.length} role${s.items!.length !== 1 ? "s" : ""}`
                    : !isOpen && sectionType === "education" && (s.items?.length ?? 0) > 0
                      ? `${s.items!.length} entr${s.items!.length !== 1 ? "ies" : "y"}`
                      : null;

            const SectionIcon = sectionType === "summary" ? AlignLeft : sectionType === "skills" ? Wrench : sectionType === "experience" ? Briefcase : GraduationCap;
            return (
              <div key={s.id || sectionType} className="rounded-xl border-2 border-(--border) bg-(--card) shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
                <button
                  type="button"
                  onClick={() => toggleSection(sectionType)}
                  className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-(--muted)/30 transition-colors rounded-t-xl"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary)">
                      <SectionIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-(--foreground) tracking-tight">{s.heading}</span>
                    {preview && <span className="block text-xs text-(--muted-foreground) mt-0.5 truncate">{preview}</span>}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-(--muted-foreground)" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-(--muted-foreground)" aria-hidden />
                  )}
                </button>
                {isOpen && (
                <div className="p-5 pt-0 space-y-3 border-t border-(--border)/50">

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
                          <div key={idx} className="rounded-lg border border-(--border) p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Input placeholder="Company" value={job.company} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, company: e.target.value } : p)))} />
                              <Input placeholder="Job title" value={job.title} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)))} />
                              <Input placeholder="Dates" value={job.dates} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p)))} />
                            </div>
                            <Textarea placeholder="Bullet points (one per line)" value={job.description} onChange={(e) => setExperienceItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))} rows={2} className="resize-y" />
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-(--destructive)" onClick={() => setExperienceItems((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setExperienceItems((prev) => [...prev, { company: "", title: "", dates: "", description: "" }])}><Plus className="h-4 w-4 mr-1" /> Add job</Button>
                      </div>
                    )}
                    {sectionType === "education" && (
                      <div className="space-y-2">
                        {educationItems.map((edu, idx) => (
                          <div key={idx} className="rounded-lg border border-(--border) bg-(--muted)/30 p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1"><Label className="text-xs">School</Label><Input value={edu.school} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, school: e.target.value } : p)))} placeholder="University name" /></div>
                              <div className="space-y-1"><Label className="text-xs">Dates</Label><Input value={edu.dates} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, dates: e.target.value } : p)))} placeholder="e.g. 2015 – 2019" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1"><Label className="text-xs">Degree</Label><Input value={edu.degree} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, degree: e.target.value } : p)))} placeholder="e.g. B.S., M.A." /></div>
                              <div className="space-y-1"><Label className="text-xs">Field of study</Label><Input value={edu.field} onChange={(e) => setEducationItems((prev) => prev.map((p, i) => (i === idx ? { ...p, field: e.target.value } : p)))} placeholder="e.g. Computer Science" /></div>
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-(--destructive)" onClick={() => setEducationItems((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setEducationItems((prev) => [...prev, { school: "", degree: "", field: "", dates: "" }])}><Plus className="h-4 w-4 mr-1" /> Add education</Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-(--border)">
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
                      <p className="text-sm text-(--muted-foreground) whitespace-pre-wrap">{s.body}</p>
                    )}
                    {snapshot?.keywords?.length ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-(--muted-foreground)">Key points for this role</p>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.keywords.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded-full bg-(--primary)/10 text-(--primary) px-3 py-1 text-xs font-medium"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSnapshotDetail((v) => !v)}
                          className="flex items-center gap-1 text-xs text-(--muted-foreground) hover:text-(--foreground)"
                        >
                          <Info className="h-3.5 w-3.5" />
                          {showSnapshotDetail ? "Hide suggestion snapshot" : "View suggestion snapshot"}
                          {showSnapshotDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {showSnapshotDetail && (
                          <div className="mt-2 rounded-lg border border-(--border) bg-(--muted)/30 p-3 text-sm space-y-2">
                            {snapshot.tailoredSummary && (
                              <div>
                                <p className="text-xs font-medium text-(--muted-foreground) mb-1">Suggested summary applied</p>
                                <p className="text-(--foreground) whitespace-pre-wrap">{snapshot.tailoredSummary}</p>
                              </div>
                            )}
                            {(snapshot.bulletSuggestions?.length ?? 0) > 0 && (
                              <div>
                                <p className="text-xs font-medium text-(--muted-foreground) mb-1">Bullet ideas</p>
                                <ul className="list-disc list-inside space-y-0.5 text-(--foreground)">
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
                            className="inline-flex items-center rounded-full bg-(--muted) text-(--foreground) px-3 py-1 text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-(--muted-foreground) italic">No skills added yet.</p>
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
                              <p className="text-sm font-medium text-(--foreground)">
                                {(title || company) && (
                                  <span>{[title, company].filter(Boolean).join(" at ")}</span>
                                )}
                                {dates && (
                                  <span className="text-(--muted-foreground) font-normal ml-1">· {dates}</span>
                                )}
                              </p>
                              {description && (
                                <ul className="mt-1 list-disc list-inside text-sm text-(--muted-foreground) space-y-0.5">
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
                      <p className="text-sm text-(--muted-foreground) italic">No experience entries yet.</p>
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
                              <p className="text-sm font-medium text-(--foreground)">
                                {parts.join(" · ")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-(--muted-foreground) italic">No education added yet.</p>
                    )}
                  </>
                )}

                {!hasContent && sectionType !== "summary" && (
                  <p className="text-sm text-(--muted-foreground) italic">Click Edit to add content.</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-(--border)">
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
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadResume(file);
          }}
        />

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-(--border) bg-(--card)/95 backdrop-blur supports-backdrop-filter:bg-(--card)/80 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <span className="text-xs font-medium text-(--muted-foreground)">Export</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handlePreviewPdf}
                disabled={isPreviewingPdf || isExportingPdf}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isPreviewingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
                Preview
              </Button>
              <Button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf || isPreviewingPdf}
                size="sm"
                className="gap-2"
              >
                {isExportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="h-4 w-4" aria-hidden />
                )}
                Download PDF
              </Button>
            </div>
            <span className="w-px h-5 bg-(--border) hidden sm:block" aria-hidden />
            <span className="text-xs font-medium text-(--muted-foreground)">Edit</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingResume}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isUploadingResume ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="h-4 w-4" aria-hidden />
                )}
                Import
              </Button>
              <Button onClick={() => enterEditMode(resume)} variant="outline" size="sm" className="gap-2">
                Edit resume
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={tailorOpen} onOpenChange={(open) => {
        setTailorOpen(open);
        if (!open) {
          setTailorResult(null);
          setJobDescriptionForTailor("");
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl border-2 border-(--border) shadow-xl bg-(--card)" aria-describedby="tailor-desc">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-(--border) bg-gradient-to-b from-(--primary)/5 to-transparent">
            <DialogTitle className="text-(--foreground) text-lg font-semibold">{tailorResult ? "Your suggestions" : "Tailor for a job"}</DialogTitle>
            <DialogDescription id="tailor-desc" className="text-(--muted-foreground) mt-1">
              {tailorResult
                ? "Review the tailored summary and keywords below. Apply to your resume or get new suggestions."
                : "Paste the job description below. We'll suggest a tailored summary and keywords."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {tailorResult ? (
              <>
                <div className="rounded-xl border-2 border-(--border) bg-(--card) shadow-md overflow-hidden">
                  <div className="p-5 space-y-4">
                    {tailorResult.tailoredSummary && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                          <AlignLeft className="h-3.5 w-3.5" aria-hidden /> Suggested summary
                        </h4>
                        <p className="text-sm text-(--foreground) leading-relaxed whitespace-pre-wrap">
                          {tailorResult.tailoredSummary}
                        </p>
                      </div>
                    )}
                    {(tailorResult.keywords?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Keywords to include
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(tailorResult.keywords ?? []).map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded-full bg-(--primary)/10 text-(--primary) px-3 py-1.5 text-xs font-medium"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(tailorResult.suggestedSkills?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                          <Wrench className="h-3.5 w-3.5" aria-hidden /> Suggested skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(tailorResult.suggestedSkills ?? []).map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center rounded-full bg-(--muted) text-(--foreground) px-3 py-1.5 text-xs font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(tailorResult.bulletSuggestions?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--muted-foreground)">
                          <Briefcase className="h-3.5 w-3.5" aria-hidden /> Bullet ideas
                        </h4>
                        <ul className="space-y-2">
                          {(tailorResult.bulletSuggestions ?? []).map((b, i) => (
                            <li key={i} className="flex gap-2 text-sm text-(--foreground)">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-(--primary)/60" aria-hidden />
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
          <DialogFooter className="shrink-0 flex flex-col gap-2 sm:flex-row flex-wrap px-6 pb-6 pt-4 border-t-2 border-(--border)">
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
      </>
  );
}
