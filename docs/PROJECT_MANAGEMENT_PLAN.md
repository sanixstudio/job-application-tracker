# Trackr: Project Management Plan

**Purpose:** How we execute Phase II (and beyond) together.  
**Roles:** You = Developer (+ helper); Me = Product Manager / Staff Engineer (specs, review, prioritization).  
**Living doc:** Update as we change cadence, tools, or process.

---

## How we use these docs (goals, mission, plan)

These docs are the **single source of truth** for where we’re going and how we work. Refer back to them whenever we need to:

- **Re-align on the goal** — Read the product vision and Phase II feature set in `PRODUCT_AND_ENGINEERING_PLAN.md`.
- **Remember the mission** — “Job-search operating system for software engineers” and the four pillars (Readiness, Efficiency, Intelligence, Clarity) live there.
- **See the full plan** — Roadmap (Phase II → III → Future), architecture, monetization, and success metrics are all in the product plan.
- **Execute in the short term** — Current sprint is in `docs/sprints/SPRINT_XX.md`; roles, cadence, and tracking are in this PM plan.
- **Start a new sprint** — Pull the next set of tasks from the product plan’s execution order and milestones; create `SPRINT_XX.md` and link back to the milestone.

We update the docs when we change direction, add a milestone, or refine process—so they stay useful for the long run.

---

## 1. Roles and Responsibilities

| Role | Who | Responsibilities |
|------|-----|------------------|
| **Product Manager** | AI (Cursor) | Prioritization, scope, acceptance criteria, user flow, saying "no" to scope creep. |
| **Staff Engineer** | AI (Cursor) | Architecture, schema design, API contracts, code review guidance, tech debt trade-offs. |
| **Developer** | You | Implementation, tests, migrations, UI, shipping. |
| **Helper** | You | Feedback on feasibility, estimates, suggesting simpler options. |

**Collaboration:** You implement; I (or you asking me) provide specs and review. We align at sprint boundaries.

---

## 2. Cadence and Ceremonies

- **Sprint length:** 2 weeks.
- **Sprint start:** Backlog for the sprint is defined in `docs/sprints/SPRINT_XX.md`.
- **Sprint end:** Demo (you show what shipped); we update the doc with Done / Not done and carry over if needed.
- **Ad-hoc:** You ask for clarification or a micro-spec anytime; we refine tasks in the sprint doc.

No formal daily standups; async updates in the sprint doc (e.g. "Task 2 in progress", "Task 1 done") are enough.

---

## 3. Milestones (Phase II)

| Milestone | Goal | Target (from plan) |
|-----------|------|--------------------|
| **M1** | Resume builder (v1) + export | ~2 months (Sprints 1–4) |
| **M2** | AI resume tailoring | ~1 month after M1 (Sprints 5–6) |
| **M3** | Chrome extension + analytics dashboard | ~1 month after M2 (Sprints 7–8) |
| **M4** | Email parsing + profile checklist | ~1 month after M3 (Sprints 9–10) |

We'll adjust targets as we learn; the order (resume → tailoring → extension → analytics → email → checklist) stays unless we decide otherwise.

---

## 4. How We Track Work

- **Source of truth:** `docs/sprints/SPRINT_XX.md` (one file per sprint).
- **Task format:** Each task has:
  - **Id** (e.g. S1-1)
  - **Title**
  - **Acceptance criteria** (so we know when it's done)
  - **Notes / spec** (links to schema, API shape, or inline details)
  - **Status:** Not started | In progress | Done
- **Backlog:** Phase II feature list lives in `docs/PRODUCT_AND_ENGINEERING_PLAN.md`; we pull from it into sprint docs.

Optional later: GitHub Projects, Linear, or Notion. For now, markdown in `docs/sprints/` is enough.

---

## 5. Definition of Done (per task)

A task is **Done** when:

- Code is implemented and merged (or in a PR you’re happy with).
- Acceptance criteria in the sprint doc are met.
- No regressions: existing app (dashboard, jobs CRUD) still works.
- If it’s a new API or DB change: schema/migration and basic error handling are in place.

We don’t require full test coverage for every first version; we do add tests for critical paths (e.g. resume API, export) when the PM plan says so.

---

## 6. Scope and Prioritization Rules

- **One major feature per milestone** (e.g. M1 = resume builder + export).
- **MVP first:** Each feature ships in a minimal but usable form; we iterate in a later sprint if needed.
- **~20% capacity for tech debt / polish:** Fixing bugs, tests, logging, or small refactors. You can reserve 1–2 tasks per sprint for this.
- **If stuck:** We shrink the task (smaller slice) or move it to the next sprint and pick something else.

---

## 7. Where Things Live

| What | Where |
|------|--------|
| Product vision & roadmap | `docs/PRODUCT_AND_ENGINEERING_PLAN.md` |
| This PM plan | `docs/PROJECT_MANAGEMENT_PLAN.md` |
| Current sprint | `docs/sprints/SPRINT_04.md` (Sprints 1–3 done) |
| DB schema | `lib/db/schema.ts` |
| Migrations | `lib/db/migrations/` |

---

## 8. Next Step

**Current sprint:** **`docs/sprints/SPRINT_04.md`** (Chrome extension, M3). Start with **S4-1**, then **S4-2**. **Completed:** Sprints 1–3 (resume, PDF export, AI tailor). When a task is done, set its status to **Done** and move to the next. At the end of the sprint we’ll close out the doc and create the next sprint (e.g. analytics) per the product plan.
