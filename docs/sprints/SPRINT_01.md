# Sprint 1 — Resume builder foundation

**Sprint goal:** User can create and edit one resume (structured data) and see it in the dashboard. No export yet.  
**Duration:** 2 weeks  
**Milestone:** M1 (Resume builder v1 + export) — this sprint is Part 1 of M1.

---

## Sprint backlog

### S1-1 — Database schema for resumes

**Status:** Done

**Description:** Add a `resumes` table and run a migration so we can store one resume per user (v1).

**Acceptance criteria:**
- [x] Table `resumes` exists with columns: `id` (PK), `userId` (not null, indexed), `title` (text, e.g. "My Resume"), `content` (jsonb — structured sections), `createdAt`, `updatedAt`.
- [x] `content` is a JSON object that can hold sections. Suggested shape (you can adjust names):
  ```json
  {
    "sections": [
      { "id": "uuid", "type": "summary", "heading": "Summary", "body": "..." },
      { "id": "uuid", "type": "experience", "heading": "Experience", "items": [{ "title": "", "company": "", "dates": "", "description": "" }] },
      { "id": "uuid", "type": "education", "heading": "Education", "items": [...] },
      { "id": "uuid", "type": "skills", "heading": "Skills", "items": ["..."] }
    ]
  }
  ```
- [x] Migration runs cleanly on Neon (`npm run db:migrate` or your current command).
- [x] Drizzle schema in `lib/db/schema.ts` updated and exported.

**Notes:**
- One row per user for now (no versioning). Use `userId` as unique for v1, or allow multiple and "primary" later; simplest is one resume per user.
- Index on `userId` for fast lookup by auth.

---

### S1-2 — API: Resume CRUD

**Status:** Done

**Description:** Implement API routes so the app can create, read, and update the current user’s resume.

**Acceptance criteria:**
- [ ] `GET /api/resumes` — returns the authenticated user’s resume (single). Returns 404 if none; 200 + body if exists. Auth via Clerk `auth()`.
- [ ] `POST /api/resumes` — creates a resume for the user. Body: `{ title?, content? }`. Default `content`: `{ sections: [] }`. Returns 201 + created resume. If user already has a resume, return 409 or upsert (your choice; for v1, 409 is fine).
- [ ] `PUT /api/resumes/[id]` — updates resume by id. Verify `resume.userId === currentUser` (403 if not). Body: `{ title?, content? }`. Returns 200 + updated resume.
- [ ] All routes return JSON: `{ success: true, data: resume }` or `{ success: false, error: "..." }`. Use same pattern as existing `/api/jobs`.
- [ ] Validation: at least ensure `content` is an object if present (e.g. Zod).

**Notes:**
- Reuse existing auth pattern from `app/api/jobs/route.ts` (get `userId`, return 401 if missing).
- Id: use `crypto.randomUUID()` or nanoid when creating.

---

### S1-3 — Types and validation for resume

**Status:** Done

**Description:** Define TypeScript types and (optional) Zod schemas for resume content so the app and API share one contract.

**Acceptance criteria:**
- [x] Types live in `types/` (e.g. `types/resume.ts` or inside `types/index.ts`). At least: `Resume`, `ResumeSection`, and section item types for experience/education/skills/summary.
- [x] API uses these types (or Zod inferred types) so request/response bodies are type-safe.
- [x] Optional: Zod schema for `content` used in PUT/POST for validation.

**Notes:**
- Section `type` can be: `"summary" | "experience" | "education" | "skills" | "projects"`. Start with summary + experience if you want to ship UI faster.

---

### S1-4 — Dashboard: Resume in nav and page shell

**Status:** Done

**Description:** Add a “Resume” entry in the dashboard layout and a resume page that loads the user’s resume (or empty state).

**Acceptance criteria:**
- [x] Dashboard layout (or nav) includes a link to `/dashboard/resume` (e.g. “Resume” next to “Home” or in a nav list).
- [x] Route `app/dashboard/resume/page.tsx` exists. It fetches the current user’s resume (client or server).
- [x] If no resume: show a simple empty state (“Create your resume”) and a button that starts creation (e.g. “Create resume” → call POST then redirect or show editor).
- [x] If resume exists: show a simple read-only view for now (e.g. title + “X sections”) and a link or button to “Edit” that goes to the editor (S1-5).

**Notes:**
- Fetch can be server-side (get userId from auth, fetch resume from DB) or client-side (React Query to `GET /api/resumes`). Either is fine; client keeps parity with jobs list.

---

### S1-5 — Minimal resume editor UI

**Status:** Done

**Description:** A page or section where the user can edit resume title and at least one section (e.g. Summary or Experience).

**Acceptance criteria:**
- [x] User can edit resume title (input).
- [x] User can add/edit at least one section type. Suggested: **Summary** (single text area) or **Experience** (list of entries with title, company, dates, description).
- [x] Changes are saved to the backend (PUT) — either on blur, on “Save” button, or debounced. No need for real-time sync in v1.
- [x] Editor is reachable from the resume page (e.g. “Edit” from S1-4). Can be same route with edit mode or `/dashboard/resume/edit`.
- [x] No console errors; form state is controlled (React state or form lib).

**Notes:**
- Keep the UI minimal: one section type is enough to validate the flow. Add more section types in a follow-up sprint.
- Use existing design system (shadcn, Tailwind). Card for the form, Button for Save.

---

## Done / not done (fill at end of sprint)

| Task | Status |
|------|--------|
| S1-1 | Done |
| S1-2 | Done |
| S1-3 | Done |
| S1-4 | Done |
| S1-5 | Done |

**Sprint 1 outcome:** All tasks done. User can create a resume, edit title + Summary section, and view it from the dashboard. Resume nav link added; API and types in place for Sprint 2 (export).

**Carryover to Sprint 2:** None.

---

## Order of work (suggested)

1. **S1-1** (schema) — unblocks API and types.
2. **S1-3** (types) — unblocks API and UI.
3. **S1-2** (API) — unblocks UI.
4. **S1-4** (page shell + empty state) — then S1-5 (editor).

You can do S1-1 and S1-3 in parallel if you prefer; then S1-2, then S1-4 and S1-5.

---

## Out of scope for Sprint 1

- PDF/DOCX export (Sprint 2).
- Multiple resumes per user.
- Drag-and-drop section reorder.
- Rich text (plain text is fine for v1).
