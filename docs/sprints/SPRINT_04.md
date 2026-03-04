# Sprint 4 — Chrome extension: save job from browser (M3)

**Sprint goal:** User can save a job (URL + title + company) from the browser into Trackr via a Chrome extension. Part of Milestone M3 (Extension in store + analytics).  
**Duration:** 2 weeks  
**Milestone:** M3

---

## Sprint backlog

### S4-1 — Extension-friendly save API

**Status:** Done

**Description:** Ensure the app can accept a “save job” request from the extension. Reuse existing `POST /api/jobs` where possible; add auth that works for the extension (e.g. API key or session cookie when extension runs in same origin).

**Acceptance criteria:**
- [ ] Existing `POST /api/jobs` (or a dedicated `POST /api/ext/save`) accepts: `title`, `company`, `url` (and optional `status`, `notes`). Request body matches current job creation schema.
- [ ] Auth: either (A) extension sends user’s session cookie (same-origin request from extension’s background/page), or (B) user copies an “API key” from the dashboard and extension sends it in a header (e.g. `X-Trackr-API-Key`). Prefer (A) if feasible so users don’t manage keys.
- [ ] CORS: if extension uses a different origin, allow requests from the extension (or use a content script that forwards to the app’s origin). Document the chosen approach.
- [ ] Response: 201 + created job, or 4xx with clear error (e.g. 401 if not authenticated).

**Notes:**
- If using API key: add `api_keys` (or similar) table and a “Generate key” flow in the dashboard later; for v1, a simple shared secret per user is enough (e.g. stored in env or user settings).
- Rate limit by user/IP to avoid abuse.

---

### S4-2 — Chrome extension (minimal)

**Status:** Done

**Description:** Build a Chrome extension (Manifest V3) that lets the user save the current job to Trackr: URL (required), title and company (pre-filled from page or manual).

**Acceptance criteria:**
- [ ] Extension installs in Chrome; popup or side panel shows: URL (pre-filled from active tab), title, company (optional fields). “Save to Trackr” button.
- [ ] On “Save”: POST to Trackr API (see S4-1). Show success (e.g. “Saved”) or error (e.g. “Sign in at trackr.example.com” or “Invalid key”).
- [ ] Optional: content script on common job sites (e.g. LinkedIn, Greenhouse, Lever) to try to parse title/company from DOM and pre-fill. If not possible or against ToS, user pastes or types. Document which sites are supported.
- [ ] Link from extension to “Open Trackr” (dashboard or job list). Optional: “Copy API key” or “Sign in” instructions in popup if auth fails.

**Notes:**
- Extension can live in this repo under `/extension` or in a separate repo; document in README.
- Manifest V3 required for Chrome Web Store.
- No scraping of LinkedIn (or others) beyond what’s visible and allowed by ToS; prefer user-driven paste or simple DOM read where permitted.

---

## Done / not done

| Task | Status       |
|------|--------------|
| S4-1 | Done         |
| S4-2 | Done         |

**Sprint 4 outcome:** _To be filled when we close the sprint._

---

## Order of work

1. **S4-1** — Decide auth (session cookie vs API key), implement or adapt API, test with curl/Postman.
2. **S4-2** — Scaffold extension (Manifest V3), implement popup form, wire to API, add “Open Trackr” link and error handling. Optionally add content script for one job board.
