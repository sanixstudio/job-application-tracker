# Sprint 5 — Application analytics (M3)

**Sprint goal:** Users see application funnel, response rate, and key metrics on the dashboard. Part of Milestone M3 (Extension + analytics).  
**Duration:** 2 weeks  
**Milestone:** M3

---

## Sprint backlog

### S5-1 — Analytics API

**Status:** Done

**Description:** Expose analytics aggregates for the current user from existing `applications` data. No new tables; compute from status and dates.

**Acceptance criteria:**
- [ ] Endpoint (e.g. `GET /api/analytics` or data folded into dashboard server load) returns: funnel counts by status (applied, interview_1–3, offer, rejected, withdrawn), total applied, response rate (e.g. % that reached at least one interview or offer), optional “no response 14+ days” count (applications still in `applied` with `appliedDate` or `updatedAt` &gt; 14 days ago).
- [ ] Auth: Clerk; only the signed-in user’s data.
- [ ] Response shape is stable and documented (e.g. in code or README).

**Notes:**
- Response rate = (interview_1 + interview_2 + interview_3 + offer) / total applied (or total applications if no applications yet, avoid div by zero).
- “Stale” = status = applied and (now - appliedDate) &gt; 14 days (use appliedDate for consistency).

---

### S5-2 — Analytics dashboard section

**Status:** Done

**Description:** Add an “Analytics” section to the dashboard with a funnel view and key metrics.

**Acceptance criteria:**
- [ ] Dashboard shows an Analytics section (below existing stats or in a dedicated area) with: funnel chart (counts by stage: Applied → Interview 1–3 → Offer; Rejected/Withdrawn can be separate or secondary).
- [ ] At least one “response rate” or “interview rate” metric (e.g. X% of applications got a response).
- [ ] Optional: “No response (14+ days)” or “Stale” count with clear label.
- [ ] Empty state when user has no applications (e.g. “Add applications to see analytics”).
- [ ] Uses existing design system (shadcn, CSS variables, chart colors from globals).

**Notes:**
- Funnel can be horizontal bar chart or vertical; keep it simple and readable.
- Recharts or similar if already in project; otherwise simple CSS bars or minimal dependency.

---

## Done / not done

| Task | Status       |
|------|--------------|
| S5-1 | Done         |
| S5-2 | Done         |

**Sprint 5 outcome:** Analytics live on dashboard: funnel by stage, response rate %, no-response (14+ days) count, empty state. Data from existing `applications` table; optional `GET /api/analytics` for client use.

---

## Order of work

1. **S5-1** — Implement analytics aggregation (API or server-side in dashboard page), return funnel + response rate + optional stale count.
2. **S5-2** — Add Analytics section to dashboard, funnel chart + metric cards, empty state.
