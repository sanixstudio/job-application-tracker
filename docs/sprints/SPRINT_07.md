# Sprint 7 — Profile checklist (M4)

**Sprint goal:** Users see a "job-ready" checklist on the dashboard (resume, LinkedIn/GitHub URLs, first application) and can complete profile items. Completes Milestone M4.  
**Duration:** 2 weeks  
**Milestone:** M4

---

## Sprint backlog

### S7-1 — Profile checklist backend

**Status:** Done

**Description:** Store profile URLs (LinkedIn, GitHub) and expose checklist state + job-ready score. No new table; extend `user_settings` with optional `linkedin_url` and `github_url`. Compute checklist from: has ≥1 resume, has LinkedIn URL, has GitHub URL, has ≥1 application.

**Acceptance criteria:**
- [ ] Schema: add `linkedinUrl` (text, nullable) and `githubUrl` (text, nullable) to `user_settings`. Migration generated and applied.
- [ ] `GET /api/profile/checklist`: returns for current user: `{ hasResume, hasLinkedIn, hasGitHub, hasFirstApplication, completedCount, totalCount, score }` (score 0–100 or 0–4; auth via Clerk). Data derived from `resumes`, `user_settings`, `applications`.
- [ ] `PATCH /api/profile/checklist` (or `PUT /api/profile`): body `{ linkedinUrl?: string, githubUrl?: string }`; validate URLs (format); update `user_settings` for current user; return updated checklist state. Auth required.
- [ ] Empty/null URLs treated as "not set"; invalid URL format returns 400.

**Notes:**
- LinkedIn/GitHub URL validation: allow https linkedin.com/in/... and github.com/... (or any valid URL pattern); keep rules simple (e.g. optional trim, max length).

---

### S7-2 — Profile checklist dashboard UI

**Status:** Done

**Description:** Dashboard section showing job-ready checklist and score; links/actions to complete each item.

**Acceptance criteria:**
- [ ] Dashboard shows a "Get job-ready" or "Profile checklist" section (e.g. above or below Analytics, consistent with Extension/Email cards). Shows: job-ready score (e.g. "2/4" or "50%") and list of items (Resume, LinkedIn, GitHub, First application) with done/pending state.
- [ ] Each incomplete item has a clear CTA: e.g. "Add resume" → link to `/dashboard/resume`, "Add LinkedIn" / "Add GitHub" → inline edit or link to a small profile form/modal, "Add your first application" → scroll/focus to JobList or Add Job.
- [ ] When all items complete, show positive state (e.g. "You're job-ready!") without nagging. Optional: allow editing LinkedIn/GitHub from the card (link to settings or inline).
- [ ] Uses existing design system (shadcn, dashboard layout). Empty/zero state is clear (e.g. "Complete these to get the most out of Trackr").

**Notes:**
- Reuse dashboard layout patterns from ExtensionKeyCard, EmailInboundCard. Keep the checklist compact (card or small section).

---

## Done / not done

| Task | Status       |
|------|--------------|
| S7-1 | Done         |
| S7-2 | Done         |

---

## Order of work

1. **S7-1** — Add `linkedinUrl` and `githubUrl` to `user_settings`; migration. Implement `GET /api/profile/checklist` (read-only aggregation) and `PATCH /api/profile/checklist` (update URLs + validation). Test with curl/Postman.
2. **S7-2** — Add `ProfileChecklistCard` (or section) to dashboard; consume checklist API; render score + items with CTAs; wire LinkedIn/GitHub edit (inline or modal).
