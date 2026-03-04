# Trackr: Product & Engineering Plan (Phase II+)

**Document version:** 1.0  
**Audience:** Product, Engineering, Leadership  
**Scope:** Post-MVP strategy, roadmap, architecture, and execution

---

## 1. Product Vision Refinement

### Current State
- **Phase I (MVP):** Job application tracking, status pipeline (applied → interview → offer/rejected), minimal dashboard, auth (Clerk), DB (Neon PostgreSQL). Solid foundation; single core loop: add job → update status → view pipeline.

### Refined Vision Statement
> **Trackr** is the job-search operating system for software engineers: one place to get job-ready, apply, track, and optimize until they get hired.

### Strategic Pillars (Post-MVP)
1. **Readiness** — Help users be *ready* (resume, profiles, prep) before and during the search.
2. **Efficiency** — Reduce friction in applying and tracking (one-click save, parsing, automation).
3. **Intelligence** — Use data and (where useful) AI to tailor materials and prioritize actions.
4. **Clarity** — One dashboard for pipeline, analytics, and next steps.

### Why This Direction
- Job seekers already track in spreadsheets and Notion; we own the “tracking” mental model and can expand into “prepare” and “apply.”
- Engineers are willing to pay for tools that save time and improve outcomes (resume builders, interview prep, automation).
- Differentiated focus on *software engineers* allows tailored features (GitHub, tech stack, system design) and clearer positioning.

---

## 2. Phase II Feature Set

Phase II should deepen the core loop and add **one** major new value pillar so the team can ship impact without fragmenting.

### Phase II Theme: **Readiness + Smarter Tracking**

| Feature | Description | Why Phase II |
|--------|-------------|--------------|
| **Resume builder (basic)** | Structured resume from profile data; export PDF/DOCX; sections: experience, education, skills, projects. | Central artifact; increases stickiness and sets up “tailoring” later. |
| **Resume tailoring (AI)** | Per-job: paste JD or URL → AI suggests bullet edits and keywords. Optional: one-click “tailored” copy. | Directly tied to “get more interviews”; clear value prop. |
| **Job save from browser** | Chrome extension: save job from LinkedIn, Greenhouse, Lever, company career pages (URL + optional title/company). | Reduces data entry; increases applications tracked in Trackr. |
| **Email parsing (inbound)** | Forward application emails (e.g. “Your application to X”) → parse and suggest “Update status” or “Add as new application.” | Keeps pipeline up to date with minimal effort. |
| **Application analytics** | Dashboard: apply rate, time-in-stage, response rate, funnel by source. Simple charts and cohort view. | Surfaces “what’s working” and justifies premium. |
| **Profile checklist** | Checklist: resume uploaded, LinkedIn/GitHub URLs added, “job-ready” score. Nudges to complete profile. | Drives activation and sets up Phase III (profile optimization). |

### Phase II *Out* of Scope (Defer to Phase III)
- Full LinkedIn/GitHub optimization and analysis (needs integrations and more UX).
- Full interview prep (curated questions, mock interviews) — can start with a “Prep” section and links.
- Heavy automation (auto-apply, complex workflows) — keep automation light in Phase II (e.g. reminders only).

---

## 3. Full Product Roadmap

### Phase II — Readiness & Smarter Tracking (Next 6–9 months)
- Resume builder (v1) + export.
- AI resume tailoring (one job at a time; paste JD or URL).
- Chrome extension: save job (URL, title, company).
- Email parsing: forward-to-parse + “Update status” / “Add application.”
- Application analytics dashboard (funnel, time-in-stage, response rate).
- Profile checklist and “job-ready” score.

### Phase III — Profile & Interview (6–12 months after Phase II)
- LinkedIn: URL import, headline/summary suggestions, keyword gap vs. target roles.
- GitHub: profile link, README/contribution hints, “portfolio readiness” checklist.
- Interview prep: question bank by topic (algorithms, system design, behavioral), simple spaced repetition or “practice” list.
- Calendar sync: link applications to upcoming interviews; prep reminders.
- Optional: light “application templates” (e.g. common answers, STAR snippets).

### Future / Long-Term Vision
- Deeper job-board integrations (aggregated search, one-click apply where APIs exist).
- Advanced automation: rules (e.g. “if stage = Interview, remind me 1 day before”), follow-up nudges.
- Community / social: anonymized benchmarks (“engineers like you get first response in X days”), optional sharing.
- Hiring-side features: companies post roles, see (anonymized) funnel stats (if we pivot or add B2B).
- Mobile app: quick status updates, notifications, on-the-go prep.

---

## 4. User Experience Flow

### Ideal User Journey

```
Sign up (Clerk)
    → Onboarding: “What’s your goal?” (Get interviews / Get offers / Just tracking)
    → Profile: name, email, resume (upload or create), LinkedIn/GitHub URLs
    → “Job-ready” checklist (resume ✓, profiles ✓, first application ✓)

Daily use:
    → See dashboard: pipeline stats, “Next steps” (e.g. “3 in Interview – prep?” “5 no response > 2 weeks”)
    → Add jobs: manual, extension, or “from email”
    → Update status from card dropdown
    → Before applying: open “Tailor resume” for this job → copy/export tailored version
    → Weekly: check Analytics (response rate, funnel)

Outcomes:
    → Fewer lost opportunities (everything in one place)
    → Better-fit applications (tailored resume)
    → Clear next actions (checklist + analytics)
```

### Key UX Principles
- **One home:** Dashboard is the single place for pipeline, next steps, and analytics.
- **Progressive depth:** Simple by default; power features (tailoring, analytics, rules) available without cluttering the first screen.
- **Respect context:** Extension and email parsing meet users where they already are (browser, inbox).

---

## 5. Technical Architecture

### High-Level Architecture (Staff Engineer View)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  Next.js App (Dashboard, Resume, Analytics) | Chrome Extension   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js API Routes)                │
│  /api/jobs | /api/resumes | /api/analytics | /api/parse-email     │
│  /api/ai/tailor | /api/ext/save (extension auth)                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Neon (PG)    │         │  AI Provider    │         │  External       │
│  Drizzle ORM  │         │  (OpenAI/Claude)│         │  (Resend, etc.) │
│  - users      │         │  Tailoring,     │         │  Email ingest   │
│  - jobs       │         │  suggestions    │         │  (future)       │
│  - resumes    │         │                 │         │                 │
│  - events     │         └─────────────────┘         └─────────────────┘
└───────────────┘
```

### Recommended Stack (Incremental on Current)
- **Keep:** Next.js (App Router), Clerk, Neon PostgreSQL, Drizzle, React Query, Tailwind/shadcn.
- **Add (Phase II):**  
  - **AI:** OpenAI or Anthropic API for resume tailoring (single backend module, prompt + safety).  
  - **Storage:** Vercel Blob or S3 for resume PDFs and exports.  
  - **Email:** Resend (or similar) for “forward-to-parse” inbox and optional notifications.  
  - **Extension:** Separate repo; Chrome Extension (Manifest V3); auth via Clerk or signed tokens from your API.

### Database Structure (Additions for Phase II)

```text
-- Resume (v1)
resumes: id, userId, title, content (JSON: sections), version, createdAt, updatedAt
resume_exports: id, resumeId, format (pdf|docx), fileUrl, createdAt

-- Tailoring
tailor_requests: id, userId, jobId, jobDescriptionHash, promptTokens, completionTokens, createdAt

-- Extension / ingest
job_sources: id, userId, source (extension|email|manual), externalId, rawPayload (JSON), createdAt

-- Analytics (materialized or computed)
-- Option A: events table for “status_changed” and aggregate in app or worker
application_events: id, applicationId, eventType, fromStatus, toStatus, createdAt
-- Option B: nightly job that writes to analytics_snapshots (e.g. daily funnel)
```

- Reuse existing `applications` (jobs) table; add optional `source` and `externalId` for extension/email.

### AI Integration (Resume Tailoring)
- **Flow:** User selects application (or pastes JD) → backend sends “current resume” + “job description” to AI → returns structured suggestions (bullet edits, keywords) or full tailored paragraph.
- **Safety:** No PII in prompts beyond what user already has in app; rate limits per user; optional audit log for abuse.
- **Cost:** Prompt size bounded (e.g. resume summary + JD); cache by `jobDescriptionHash` to avoid re-tailoring same JD.

### Scalability
- **Phase II:** Single Next.js app + Neon is enough; use serverless for API routes; background jobs (e.g. email parsing, analytics aggregation) via Vercel Cron or a small worker (Inngest, Trigger.dev, or queue + worker).
- **Phase III:** Consider separating “heavy” services (email ingest, analytics ETL) into dedicated workers; keep core CRUD and AI in Next.js until needed.
- **Extension:** Stateless; all state in your API; rate limit by user and by IP.

### APIs and Integrations
- **Phase II:**  
  - **Chrome Extension:** Your API only; no LinkedIn/GitHub scraping; user pastes or extension parses DOM for title/company/URL (within ToS of job sites).  
  - **Email:** Inbound webhook or “forward to address” → parse → create/update application.  
- **Phase III:**  
  - **LinkedIn:** Use official APIs where available (e.g. profile) or read-only scraping only if compliant with ToS; prefer “user pastes URL” + we fetch public profile if allowed.  
  - **GitHub:** REST/GraphQL for public profile, repos, contributions; no write access needed for “readiness” hints.

---

## 6. Monetization Model

### Pricing Tiers (Startup-Friendly)

| Tier | Price | Target | Features |
|------|--------|--------|----------|
| **Free** | $0 | Try before commit | Up to N applications (e.g. 10–20), basic tracking, 1 resume, no tailoring, no analytics |
| **Pro** | $9–15/mo or $90–120/yr | Active job seeker | Unlimited applications, AI tailoring (e.g. 20–50/month), analytics, export, extension, email parsing |
| **Team / Future** | TBD | Bootcamps, cohorts | Shared views, bulk features, admin (later) |

### Free vs Paid (Phase II)
- **Free:** Core tracking (capped), basic resume builder, profile checklist, 1 resume export.
- **Paid:** Unlimited applications, AI resume tailoring, application analytics, Chrome extension, email parsing, unlimited exports, priority support (optional).

### Rationale
- Low barrier to start; pay when value is proven (tailoring, analytics, automation).
- Annual discount improves LTV and reduces churn.
- Later: add “one-time” or credit packs for users who don’t want subscription (e.g. 10 tailor credits).

---

## 7. Success Metrics

### Activation
- **Signed up → First application added** (e.g. within 24h or 7d).
- **Profile completeness:** % with resume + at least one profile URL.
- **“Job-ready” checklist:** % completing all steps.

### Engagement
- **DAU/MAU** (or WAU/MAU) for active job seekers.
- **Applications added per week** (total and per user).
- **Status updates per week** (indicates pipeline is being used).
- **Resume tailors per week** (Phase II); **Extension saves per week**.

### Retention
- **D1, D7, D30** retention after signup.
- **Churn** (cancel or lapse) by cohort.
- **Resurrection:** % of churned users who come back after 30+ days.

### Revenue
- **MRR / ARR;** **trial → paid conversion rate.**
- **LTV** (simplified: ARPU × avg tenure); **CAC** when you have marketing.

### North Star (Candidate)
- **“Applications with status updated in the last 7 days”** (active pipeline) or  
- **“Weekly active users who added or updated at least one application.”**

---

## 8. Execution Plan

### What to Build First (Phase II Order)
1. **Resume builder (v1) + export** — Unblocks “tailoring” and increases perceived value; schema and storage for `resumes` and `resume_exports`.
2. **AI resume tailoring** — Core differentiator; integrate one model, one flow (paste JD → get suggestions).
3. **Chrome extension (minimal)** — Save URL + title + company; post to existing `/api/jobs`; auth via API key or session.
4. **Application analytics** — Use existing `applications` data; add simple aggregates (funnel, time-in-stage, response rate) and a dashboard tab.
5. **Email parsing** — Inbound endpoint + parser (regex/heuristic or small model) → suggest “Add” or “Update status”; optional Resend inbound.
6. **Profile checklist** — UI + lightweight backend (e.g. checklist state per user); “job-ready” score from checklist + maybe application count.

### Milestones (Phase II)
- **M1 (≈2 months):** Resume builder live; at least one export format (PDF or DOCX).
- **M2 (≈1 month after M1):** Tailoring live for Pro; usage and cost monitored.
- **M3 (≈1 month after M2):** Extension in Chrome store; analytics dashboard in app.
- **M4 (≈1 month after M3):** Email parsing live; profile checklist and onboarding polished.

### Prioritization Rules
- **Must have for Phase II:** Resume builder, tailoring, extension, analytics.  
- **Should have:** Email parsing, profile checklist.  
- **Nice to have:** Multiple export formats, more AI suggestions (e.g. LinkedIn headline).

### Team and Cadence
- Assume **1–2 engineers** plus product/design as needed.
- **2-week sprints;** ship one major feature per milestone; keep MVP stable (no regressions).
- **Tech debt:** Allocate ~20% of capacity; e.g. tests for new modules (resume, tailoring, analytics), logging, and error handling.

---

## Summary

- **Product:** Evolve from “track applications” to “get job-ready and track smarter” with Phase II focused on **resume + tailoring + extension + analytics + email parsing + profile checklist.**
- **Roadmap:** Phase II (6–9 months) → Phase III (profile + interview prep) → Future (automation, community, B2B).
- **Architecture:** Stay on Next.js + Neon + Drizzle; add AI, blob storage, extension API, and optional background workers; keep schema and APIs clear for Phase III.
- **Business:** Free (capped) + Pro (subscription) with clear differentiators (tailoring, analytics, extension, parsing).
- **Execution:** Resume first, then tailoring, then extension and analytics, then email and checklist; measure activation, engagement, retention, and revenue.

This plan is intended as a living document: update as you ship, learn from metrics, and adjust Phase III and beyond based on what drives retention and revenue.
