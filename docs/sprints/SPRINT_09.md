# Sprint 9 — Follow-up & next actions (research-backed)

**Sprint goal:** Implement the highest-value, research-backed improvements so Trackr directly addresses job-seeker pain: follow-up discipline, next actions, and resume–application link.  
**Duration:** 2–3 weeks  
**Research source:** `docs/JOB_SEEKER_RESEARCH_AND_RECOMMENDATIONS.md`  
**Context:** Phase II complete; Sprint 8 optional. This sprint focuses on “useful, valuable, working” outcomes from pain-point and competitor research.

---

## Where we are

- **Done:** Applications (Kanban + list, date filter), resume + tailor, extension, analytics (funnel, response rate, stale), email parsing, profile checklist.
- **Gap (from research):** Follow-up reminders, “no response” actions, resume used per application, dashboard “next actions,” and light tips/benchmarks.

---

## Sprint 9 backlog (priority order)

### High impact, feasible

| ID   | Task | Description | Status   |
|------|------|-------------|----------|
| S9-1 | **Follow-up reminder (per application)** | Add optional “Remind me to follow up on [date]” (or “in 5 days”) per job; store in DB; surface in dashboard or Applications as “Due: follow up” or list of applications due this week. | Done |
| S9-2 | **No-response 7-day tier + CTA** | Besides “No response 14+ days,” add “No response 7–14 days” and a clear CTA (e.g. “Consider following up” with link to tip or template). | Done |
| S9-3 | **Resume used per application** | Optional field on job: `resumeId` (or “resume version” label). Show in list/Kanban; allow picking resume when adding/editing application. | Done |
| S9-4 | **Dashboard next actions** | One card or section: e.g. “Follow up: 3 applications,” “No response 7+ days: 5,” “Interviews this week: 2.” Link to Applications with the right filter. | Done |
| S9-5 | **Tips/benchmarks in UI** | Add 1–2 short tips in dashboard or Applications (e.g. “First follow-up: 5–7 business days after applying”; “Tailored resumes tend to get more interviews”). Can be a small “Tip” or “Insight” component. | Done |

### Optional (if time)

| ID   | Task | Description | Status   |
|------|------|-------------|----------|
| S9-6 | **Follow-up email template** | Simple copy-paste “Follow-up after application” template (or open in mailto) from application detail or no-response list. | Not started |
| S9-7 | **Export applications (CSV)** | `GET /api/jobs/export?format=csv` and a “Export” button on Applications so users own their data. | Not started |

---

## Recommendation

1. **Start with S9-2** (no-response 7-day + CTA): small change, immediate value, no schema change.
2. **Then S9-5** (tips): fast, reinforces best practices.
3. **Then S9-3** (resume per application): needs schema + form + list/Kanban display.
4. **Then S9-1** (follow-up reminder): needs schema (e.g. `followUpAt` or `remindAt`), date picker, and dashboard/Applications surface.
5. **Then S9-4** (next actions): aggregates from existing data + S9-1/S9-2.

S9-6 and S9-7 can slip to Sprint 10 if needed.

---

## Done / not done

| Task   | Status       |
|--------|--------------|
| S9-1   | Done         |
| S9-2   | Done         |
| S9-3   | Done         |
| S9-4   | Done         |
| S9-5   | Done         |
| S9-6   | Not started  |
| S9-7   | Not started  |

---

## Order of work

1. Read `docs/JOB_SEEKER_RESEARCH_AND_RECOMMENDATIONS.md` for rationale.
2. Implement in order above; update task status in this doc.
3. At sprint end, update `IMPLEMENTATION_STATUS.md` and decide Sprint 10 (e.g. contact per application, time-in-stage analytics).
