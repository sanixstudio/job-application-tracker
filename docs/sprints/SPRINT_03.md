# Sprint 3 — AI resume tailoring (M2)

**Sprint goal:** User can paste a job description and get AI suggestions to tailor their resume (e.g. summary and keywords).  
**Duration:** 2 weeks  
**Milestone:** M2

---

## Sprint backlog

### S3-1 — Tailor API (AI)

**Status:** Done

**Description:** Backend endpoint that accepts resume content + job description, calls an AI provider, and returns tailored suggestions (e.g. suggested summary, keywords to include).

**Acceptance criteria:**
- [x] Endpoint: `POST /api/ai/tailor`. Body: `{ jobDescription: string, resumeContent?: ResumeContent }`. Auth required. If no resume, return 400 or fetch user's resume.
- [x] Call AI (OpenAI) with a prompt: current resume summary/sections + job description → return structured suggestions (e.g. `{ tailoredSummary?: string, keywords?: string[], bulletSuggestions?: string[] }`).
- [x] Response: `{ success: true, data: { ... } }`. Rate limit or cost consideration: optional for v1.
- [x] API key from env (`OPENAI_API_KEY`). If missing, return 503 with a clear message.

**Notes:**
- Keep prompt concise; send only summary + job description to limit tokens.
- No PII in prompts beyond what the user already has in their resume.

---

### S3-2 — Tailor UI on resume page

**Status:** Done

**Description:** Resume page has a "Tailor for a job" (or "Get suggestions") entry point that opens a flow: paste JD → get suggestions → show and optionally apply to summary.

**Acceptance criteria:**
- [x] When user has a resume (view mode), show a "Tailor for a job" button (or similar).
- [x] Clicking opens a dialog/modal: text area for job description, "Get suggestions" button.
- [x] On submit: call `POST /api/ai/tailor` with current resume content + pasted JD. Show loading state.
- [x] Display returned suggestions (tailored summary, keywords, etc.). User can copy or "Apply to summary" to replace the Summary section and go to edit mode.
- [x] Error handling: toast if API key missing or request fails.

---

## Done / not done

| Task | Status   |
|------|----------|
| S3-1 | Done     |
| S3-2 | Done     |

**Sprint 3 outcome:** User can open "Tailor for a job", paste a JD, get AI suggestions (tailored summary, keywords, bullet ideas), and apply the summary to their resume. Requires `OPENAI_API_KEY` in `.env.local`.

---

## Order of work

1. **S3-1** — Implement tailor API and test with curl/Postman.
2. **S3-2** — Add button, dialog, and wire to API; "Apply to summary" updates resume and switches to edit.
