# Implementation Status

**Source of truth for execution:** `docs/PRODUCT_AND_ENGINEERING_PLAN.md`, `docs/PROJECT_MANAGEMENT_PLAN.md`, `docs/sprints/SPRINT_XX.md`.

---

## ✅ Completed

### Phase 1: Foundation (MVP)

- Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui
- Database: Neon PostgreSQL, Drizzle ORM, migrations
- Auth: Clerk (sign-in, sign-up, protected dashboard)
- Job applications: CRUD API (`/api/jobs`, `/api/jobs/[id]`), dashboard, JobList, JobCard, JobForm, status filter, delete with confirmation
- React Query, form validation (Zod), optimistic updates

### Phase II — M1: Resume builder + export (Sprints 1–2)

- Resume schema and migrations (`resumes` table, `ResumeContent` JSONB)
- Resume CRUD: `GET/POST /api/resumes`, `GET/PUT /api/resumes/[id]`
- Resume types and validation (`lib/validations/resume.ts`)
- Resume page: create/edit (title + Summary), view mode
- PDF export: `GET /api/resumes/[id]/export?format=pdf` (jspdf), Download PDF button
- Nav: Dashboard, Applications, Resume, Email, Settings, Home (dedicated pages for applications and email; extension key in Settings)

### Phase II — M2: AI resume tailoring (Sprint 3)

- `POST /api/ai/tailor`: accepts `jobDescription` + optional `resumeContent`, returns `tailoredSummary`, `keywords`, `bulletSuggestions` (OpenAI). `OPENAI_API_KEY` env; 503 if missing.
- Resume page: “Tailor for a job” button → modal with JD textarea, “Get suggestions”, result view (summary, keywords, bullets), “Apply to summary”, “Get new suggestions”
- Apply to summary: opens edit mode with tailored summary; optional `lastTailorSnapshot` (keywords + snapshot) saved with resume and shown as chips + “View suggestion snapshot” on the resume card

### Documentation

- ARCHITECTURE.md, SETUP.md, README, .env.example
- docs/PRODUCT_AND_ENGINEERING_PLAN.md, docs/PROJECT_MANAGEMENT_PLAN.md
- docs/sprints/SPRINT_01.md … SPRINT_07.md (all Done)

### Sprint 7 — Profile checklist (M4) — DONE

- **S7-1** Profile checklist backend: `linkedinUrl`/`githubUrl` on user_settings, GET/PATCH `/api/profile/checklist`, job-ready score
- **S7-2** Profile checklist dashboard UI: ProfileChecklistCard on dashboard, score + CTAs

### Recent UX & layout (post–S7)

- **Sidebar (shadcn-style):** App sidebar with nav (Dashboard, Applications, Resume, Career profiles, Email, Settings, Home), collapsible to icons on desktop, sheet drawer on mobile; sticky sidebar so it touches viewport bottom when content scrolls.
- **Layout:** Main content area in document flow (no overlap with sidebar); header with trigger, theme toggle, user button.
- **Applications page — Kanban:** Application Tracker with Board/List view toggle, date filter (All time / Last 90 days), drag-and-drop Kanban board (@dnd-kit) with columns Applied → Interviewing → Offer → Rejected → Withdrawn; status updates on drop via API. List view retains existing JobList grid.

---

## 🚧 In Progress

**Current:** Flagship Resume OS — core APIs and workspace done; export templates, migration, and polish/guardrails remaining (see plan and `docs/RESUME_OS.md`). Phase II (M1–M4) otherwise complete. Next: Sprint 8 or Phase III kickoff (see `docs/sprints/SPRINT_08.md` and product plan).

---

## 📋 Next (from product plan)

### Sprint 4 — Chrome extension (M3) — DONE

- **S4-1** Extension save API; **S4-2** Chrome extension (Manifest V3)

### Sprint 5 — Application analytics (M3) — DONE

- **S5-1** Analytics API; **S5-2** Dashboard analytics section

### Sprint 6 — Email parsing (M4) — DONE

- **S6-1** Inbound + parser; **S6-2** Suggestions API + dashboard UI

### Sprint 8+ / Phase III (see docs/sprints/SPRINT_08.md)

- Optional polish: tests, onboarding, performance.
- Phase III (product plan): LinkedIn/GitHub profile hints, interview prep, calendar sync.

### Sprint 9 — Follow-up & next actions (research-backed) — DONE

- **Source:** `docs/JOB_SEEKER_RESEARCH_AND_RECOMMENDATIONS.md`.
- **Done:** Follow-up reminder per application (S9-1): `followUpAt` on applications, date picker in JobForm, "Follow up" badge on Kanban cards when due. Resume used per application (S9-3): `resumeId` on applications, resume selector in JobForm. No-response 7–14 day tier + CTA (S9-2) in DashboardAnalytics. Dashboard next actions card (S9-4): follow-up due, no response 7+, interviewing counts + link to Applications. Tips card (S9-5) on dashboard. Optional: S9-6 (follow-up template), S9-7 (CSV export) not started.

### Career profiles (LinkedIn / GitHub optimization) — DONE

- **Purpose:** Give users a clear reason for adding LinkedIn/GitHub: optimize headline, summary, and bio with AI, then copy and apply on each platform.
- **DB:** `career_profiles` table (id, userId, platform, profile_url, sections JSONB). Sections: headline/summary (LinkedIn), bio (GitHub), each with `current`, `optimized`, `generatedAt`.
- **API:** GET `/api/career-profiles` (list; seeds from user_settings if URLs exist; ensures both platforms have a row). GET/PATCH `/api/career-profiles/[id]`. POST `/api/career-profiles/[id]/optimize` (section + optional currentContent → AI suggestion, saved as optimized).
- **UI:** `/dashboard/career-profiles` page with purpose copy, LinkedIn and GitHub cards: profile URL, per-section current (paste) + “Optimize with AI” + suggested text + “Copy to clipboard”. Nav: “Career profiles” in sidebar. Profile checklist: “Add & optimize LinkedIn/GitHub” links to this page; dialog copy explains AI optimization.

### Flagship Resume OS (Resume SaaS Operating Manual)

- **Purpose:** JD-aware resume workspace aligned with the Operating Manual (ATS-safe, human-sounding, defensible). This is the flagship resume experience; the original Resume page remains the stable editor + PDF export.
- **Docs/plan:** `docs/RESUME_OS.md` (overview + Resume vs Resume OS); execution plan in `.cursor/plans/` (Flagship Resume OS).
- **Model:** `lib/resume/model.ts` — `CandidateProfile`, `ExperienceEntry`, `AchievementFact`, `MetricFact`, `JobDescriptionProfile`, `ResumeBullet`, `ResumeVersion`, `ResumeVersionAudit`, `ResumeOsContent`. Zod schemas in `lib/validations/resume-os.ts`.
- **APIs:**  
  - `POST /api/ai/jd-profile` — raw JD → structured `JobDescriptionProfile` (title, seniority, required/preferred skills, domain terms, signal phrases, hiring priorities).  
  - `POST /api/ai/resume-score` — `profile` + `jdProfile` + `content` (current `ResumeContent`) → general score, match score, keyword coverage (`lib/resume-score`).  
  - `POST /api/ai/bullets` — `mode` (generate | humanize), `jdProfile`, `facts` or `existingBullets` → `ResumeBullet[]`.  
  - `POST /api/ai/resume-audit` — `resumeText` + optional `jdProfile` → ATS safety, JD alignment, experience quality, human quality, defensibility, total, `riskFlags[]`.
- **UI:** `/dashboard/resume-os` — "Resume OS (beta)" in sidebar. Left: Target job (paste JD → Analyze job description → parsed title, skills, hiring priorities). Right: Resume preview + "Tailor resume to this job" → calls score, bullets, audit in parallel; shows match scores, audit summary, suggested bullets (copy into experience).
- **Remaining (plan):** Export templates (version + layout params on `/api/resumes/[id]/export`), one-way migration (current sections → `CandidateProfile` + Master version), polish/guardrails (prompts + copy).

### Later (Phase III+)

- Interview prep, calendar sync (see product plan)
- Email integration (Gmail OAuth, monitoring) — was in old “Phase 2” plan; now follows product plan order (extension + analytics first)

---

## 📊 Progress Summary


| Milestone                | Status         | Sprints                 |
| ------------------------ | -------------- | ----------------------- |
| M1 Resume + export       | ✅ Done         | S1, S2                  |
| M2 AI tailoring          | ✅ Done         | S3                      |
| M3 Extension + analytics | ✅ Done         | S4, S5                  |
| M4 Email + checklist     | ✅ Done         | S6, S7                  |


**Overall:** Phase II complete (M1–M4). Sprints 1–7 done. Next: Sprint 8 (polish or Phase III start). See `docs/sprints/SPRINT_08.md`.

---

## 🎯 Immediate Next Steps

1. **Flagship Resume OS:** Finish export (version/layout), migration (sections → profile + Master version), polish/guardrails. See `docs/RESUME_OS.md`.
2. Choose focus for **Sprint 8**: polish (tests, onboarding, performance) or Phase III (e.g. interview prep section, LinkedIn/GitHub hints per product plan).
3. Update `docs/sprints/SPRINT_08.md` with selected tasks and track progress.
4. Keep `docs/PRODUCT_AND_ENGINEERING_PLAN.md` and `docs/PROJECT_MANAGEMENT_PLAN.md` as source of truth for roadmap and process.

---

## 💡 Notes

- Auth is Clerk; DB is Neon PostgreSQL (see README and .env.example).
- Tailor “previous responses” (history) was removed; no persistence of past suggestions.
- Execution order follows `docs/PRODUCT_AND_ENGINEERING_PLAN.md` §8 (resume → tailoring → extension → analytics → email → checklist).

