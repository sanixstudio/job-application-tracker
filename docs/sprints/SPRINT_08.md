# Sprint 8 — Polish & next direction (post–Phase II)

**Sprint goal:** Align docs with current state, then either polish the app or start Phase III work.  
**Duration:** 2 weeks  
**Context:** Phase II (M1–M4) is complete. Sprints 1–7 done. See `IMPLEMENTATION_STATUS.md` and `docs/PRODUCT_AND_ENGINEERING_PLAN.md`.

---

## Where we are

- **Done:** Foundation, resume + export, AI tailoring, Chrome extension, analytics, email parsing, profile checklist (Sprints 1–7). Recent: sidebar layout, Kanban board on Applications page, view toggle, date filter.
- **Source of truth:** Product vision and roadmap → `docs/PRODUCT_AND_ENGINEERING_PLAN.md`. Execution order and milestones → `docs/PROJECT_MANAGEMENT_PLAN.md`. Current status → `IMPLEMENTATION_STATUS.md`.

---

## Sprint 8 options (pick one track or mix)

### Track A — Polish & quality

| Task   | Description | Status   |
|--------|-------------|----------|
| S8-A1  | Add/expand tests for critical paths (e.g. jobs API, profile checklist, Kanban status update). | Not started |
| S8-A2  | Onboarding polish: first-time user flow, empty-state copy, optional “What’s next” hints. | Not started |
| S8-A3  | Performance: lazy-load heavy components (e.g. resume page), ensure analytics/dashboard remain fast. | Not started |
| S8-A4  | Tech debt: logging, error boundaries, or small refactors per 20% rule. | Not started |

### Track B — Phase III kickoff (product plan)

Phase III themes (from product plan): profile optimization, interview prep, calendar sync.

| Task   | Description | Status   |
|--------|-------------|----------|
| S8-B1  | **Interview prep (light):** Add a “Prep” or “Resources” section (e.g. link list or placeholder) and route; no full question bank yet. | Not started |
| S8-B2  | **LinkedIn/GitHub hints:** Use existing `linkedinUrl`/`githubUrl` from profile checklist to show a simple “Profile tips” card (e.g. “Add your LinkedIn to get tailored suggestions later”). | Not started |
| S8-B3  | **Calendar sync (spike):** Document options (e.g. Calendly, Google Calendar API) and decision; no implementation. | Not started |

### Track C — Documentation only

| Task   | Description | Status   |
|--------|-------------|----------|
| S8-C1  | Update `ARCHITECTURE.md` with sidebar, Applications Kanban, and current route structure. | Not started |
| S8-C2  | Update `docs/UX_RESEARCH_AND_IMPROVEMENTS.md` with Kanban and layout decisions. | Not started |

---

## Recommendation

1. **Short term:** Do **S8-C1** (and optionally S8-C2) so architecture and UX docs match the current app.
2. **Then choose:**  
   - **Polish:** S8-A1 (tests) and/or S8-A2 (onboarding).  
   - **Phase III:** S8-B1 (Prep section) or S8-B2 (profile hints) as first small slice.

---

## Done / not done

| Task   | Status       |
|--------|--------------|
| S8-*   | Not started  |

---

## Order of work

1. Update `ARCHITECTURE.md` and (optional) `docs/UX_RESEARCH_AND_IMPROVEMENTS.md`.
2. Pick Track A, B, or C (or 1–2 tasks from each).
3. Implement; set task status to Done in this doc as you go.
4. At sprint end, decide next sprint (continue Phase III or more polish).
