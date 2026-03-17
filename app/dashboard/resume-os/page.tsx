"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileText } from "lucide-react";
import type { Resume, ResumeContent } from "@/types";
import type {
  JobDescriptionProfile,
  ResumeBullet,
  ResumeVersionAudit,
} from "@/lib/resume/model";
import type { ResumeScoreWithJobResult } from "@/lib/resume-score";

async function fetchResume(): Promise<Resume | null> {
  const res = await fetch("/api/resumes");
  const data = await res.json();
  if (res.status === 404) return null;
  if (!data.success) throw new Error(data.error || "Failed to fetch resume");
  return data.data;
}

function buildResumeText(content: ResumeContent | undefined): string {
  if (!content) return "";
  const sections = content.sections ?? [];
  const parts: string[] = [];
  for (const s of sections) {
    if (s.heading) parts.push(s.heading);
    if (s.body) parts.push(s.body);
    for (const item of s.items ?? []) {
      const line = Object.entries(item)
        .filter(([, v]) => v != null && String(v).trim() !== "")
        .map(([, v]) => String(v))
        .join(" · ");
      if (line) parts.push(line);
    }
  }
  return parts.join("\n\n");
}

function getExperienceBullets(content: ResumeContent | undefined): string[] {
  if (!content) return [];
  const bullets: string[] = [];
  for (const s of content.sections ?? []) {
    if (s.type !== "experience") continue;
    for (const item of s.items ?? []) {
      const desc = (item.description ?? item.bullets ?? "").trim();
      if (!desc) continue;
      for (const line of desc.split(/\r?\n/)) {
        const cleaned = line.trim();
        if (cleaned) bullets.push(cleaned);
      }
    }
  }
  return bullets;
}

export default function ResumeOsPage() {
  const { data: resume, isLoading, error } = useQuery({
    queryKey: ["resume-os"],
    queryFn: fetchResume,
  });

  const [jobDescription, setJobDescription] = useState("");
  const [jdProfile, setJdProfile] = useState<JobDescriptionProfile | null>(null);
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ResumeScoreWithJobResult | null>(null);
  const [bulletSuggestions, setBulletSuggestions] = useState<ResumeBullet[] | null>(null);
  const [audit, setAudit] = useState<ResumeVersionAudit | null>(null);

  const handleParseJd = async () => {
    if (!jobDescription.trim()) return;
    setIsParsingJd(true);
    try {
      const res = await fetch("/api/ai/jd-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to parse job description");
      }
      setJdProfile(json.data as JobDescriptionProfile);
    } catch (err) {
      console.error(err);
      setJdProfile(null);
    } finally {
      setIsParsingJd(false);
    }
  };

  const handleTailor = async () => {
    if (!resume || !jdProfile) return;
    setIsTailoring(true);
    setScoreResult(null);
    setBulletSuggestions(null);
    setAudit(null);
    try {
      const content = resume.content as ResumeContent;
      const resumeText = buildResumeText(content);
      const existingBullets = getExperienceBullets(content);

      const profileStub = {
        name: resume.title || "Resume",
        contact: { email: "unknown@example.com" },
        target_titles: [],
      };

      const [scoreRes, bulletsRes, auditRes] = await Promise.all([
        fetch("/api/ai/resume-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: profileStub,
            jdProfile,
            content,
          }),
        }).then(async (r) => {
          const json = await r.json();
          if (!r.ok || !json.success) throw new Error(json.error ?? "Failed to score resume");
          return json.data as ResumeScoreWithJobResult;
        }),
        fetch("/api/ai/bullets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "humanize",
            jdProfile,
            facts: [],
            existingBullets,
          }),
        }).then(async (r) => {
          const json = await r.json();
          if (!r.ok || !json.success) throw new Error(json.error ?? "Failed to generate bullets");
          return json.data as ResumeBullet[];
        }),
        fetch("/api/ai/resume-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdProfile,
            resumeText,
          }),
        }).then(async (r) => {
          const json = await r.json();
          if (!r.ok || !json.success) throw new Error(json.error ?? "Failed to audit resume");
          return json.data as ResumeVersionAudit;
        }),
      ]);

      setScoreResult(scoreRes);
      setBulletSuggestions(bulletsRes);
      setAudit(auditRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTailoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-(--muted-foreground)" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-(--border) p-6">
        <p className="text-sm text-(--destructive)">
          Failed to load resume. {String(error)}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--foreground)">Resume workspace (beta)</h1>
        <p className="text-sm text-(--muted-foreground) mt-0.5">
          Build, tailor, and audit your resume for specific roles.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)]">
        <Card className="rounded-2xl border-(--border) bg-(--card)">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-(--foreground)">
              Target job
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              className="resize-y"
            />
            <Button
              type="button"
              onClick={handleParseJd}
              disabled={isParsingJd || !jobDescription.trim()}
              className="gap-2"
            >
              {isParsingJd ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze job description
            </Button>
            {jdProfile && (
              <div className="mt-3 rounded-lg border-(--border) bg-(--muted)/40 p-3 space-y-1.5 text-sm">
                <div className="font-semibold text-(--foreground)">
                  {jdProfile.title}
                  {jdProfile.company ? ` · ${jdProfile.company}` : ""}
                  {jdProfile.seniority ? ` (${jdProfile.seniority})` : ""}
                </div>
                {jdProfile.required_skills?.length ? (
                  <div>
                    <p className="text-xs font-medium text-(--muted-foreground)">Must-have skills</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {jdProfile.required_skills.slice(0, 12).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full bg-(--muted) px-2.5 py-0.5 text-xs text-(--foreground)"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {jdProfile.summary_of_hiring_priorities?.length ? (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-(--muted-foreground)">What this role really cares about</p>
                    <ul className="mt-1 list-disc list-inside text-xs text-(--muted-foreground) space-y-0.5">
                      {jdProfile.summary_of_hiring_priorities.slice(0, 5).map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-(--border) bg-(--card)">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-(--foreground)">
              Resume preview & suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resume ? (
              <>
                <div className="flex items-center gap-2 text-sm text-(--muted-foreground)">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-(--foreground)">{resume.title}</span>
                  <span className="text-xs">
                    · {resume.content?.sections?.length ?? 0} section
                    {(resume.content?.sections?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleTailor}
                  disabled={!jdProfile || isTailoring}
                  className="gap-2"
                >
                  {isTailoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Tailor resume to this job
                </Button>
                {!jdProfile && (
                  <p className="text-xs text-(--muted-foreground)">
                    Paste a job description on the left and analyze it first, then tailor your resume.
                  </p>
                )}
                {scoreResult && (
                  <div className="mt-2 rounded-lg border-(--border) bg-(--muted)/40 p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-(--foreground)">Match scores</p>
                    <p className="text-(--muted-foreground)">
                      General quality: <span className="font-medium text-(--foreground)">{scoreResult.generalScore}</span>/100 ·
                      Match to job: <span className="font-medium text-(--foreground)">{scoreResult.matchScore}</span>/100
                    </p>
                    {scoreResult.keywordMatch?.total ? (
                      <p className="text-(--muted-foreground)">
                        Keywords matched:{" "}
                        <span className="font-medium text-(--foreground)">
                          {scoreResult.keywordMatch.found}/{scoreResult.keywordMatch.total}
                        </span>
                      </p>
                    ) : null}
                  </div>
                )}
                {audit && (
                  <div className="mt-2 rounded-lg border-(--border) bg-(--muted)/30 p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-(--foreground)">Audit</p>
                    <p className="text-(--muted-foreground)">
                      ATS safety: {audit.atsSafety} · JD alignment: {audit.jdAlignment} · Experience: {audit.experienceQuality} ·
                      Human: {audit.humanQuality} · Defensibility: {audit.defensibility} · Total:{" "}
                      <span className="font-medium text-(--foreground)">{audit.total}</span>
                    </p>
                    {audit.riskFlags?.length ? (
                      <ul className="mt-1 list-disc list-inside space-y-0.5 text-(--muted-foreground)">
                        {audit.riskFlags.slice(0, 5).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
                {bulletSuggestions && bulletSuggestions.length > 0 && (
                  <div className="mt-2 rounded-lg border-(--border) bg-(--muted)/20 p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-(--foreground)">Suggested bullets (copy into your experience)</p>
                    <ul className="mt-1 space-y-1.5">
                      {bulletSuggestions.map((b) => (
                        <li key={b.id} className="text-(--muted-foreground)">
                          • {b.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-(--muted-foreground)">
                You don&apos;t have a resume yet. Create one from the main Resume page, then return here to tailor it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

