# Sprint 2 — Resume export (complete M1)

**Sprint goal:** User can download their resume as a PDF. Completes Milestone M1 (Resume builder v1 + export).  
**Duration:** 2 weeks  
**Milestone:** M1

---

## Sprint backlog

### S2-1 — PDF export API

**Status:** Done

**Description:** Add an endpoint that generates a PDF from the user's resume content and returns it as a downloadable file.

**Acceptance criteria:**
- [x] Endpoint: `GET /api/resumes/[id]/export?format=pdf` (or `POST /api/resumes/[id]/export` with body `{ format: "pdf" }`). Auth: user must own the resume (same as PUT).
- [x] Response: PDF file with `Content-Disposition: attachment; filename="resume.pdf"`. Status 200. Body is the PDF binary.
- [x] PDF content: resume title + each section (heading + body or items). Simple layout is fine (e.g. title, then sections one after another).
- [x] If resume not found or not owner: 404.

**Notes:**
- Use a server-side PDF library (e.g. jspdf, pdf-lib, or @react-pdf/renderer). jspdf is lightweight and works in Node/serverless.
- No need to persist the file for v1; generate on demand and stream/return the buffer.

---

### S2-2 — Download PDF button on resume page

**Status:** Done

**Description:** Resume page (view mode) shows a "Download PDF" button that calls the export API and triggers a file download.

**Acceptance criteria:**
- [x] When resume exists and user is in view mode (not editing), show a "Download PDF" button (or "Export" with PDF option).
- [x] Clicking it requests the export URL (e.g. `GET /api/resumes/{id}/export?format=pdf`) and triggers download (e.g. open in new tab with blob URL, or fetch + create object URL + anchor click).
- [x] Loading state while generating (optional but recommended).
- [x] Error handling: toast or message if export fails.

---

## Done / not done (fill at end of sprint)

| Task | Status   |
|------|----------|
| S2-1 | Done     |
| S2-2 | Done     |

**Sprint 2 outcome:** User can download their resume as PDF from the resume page. M1 (Resume builder v1 + export) complete.

**Carryover:** _Any task not done._

---

## Order of work

1. **S2-1** — Implement export API and verify with curl or browser.
2. **S2-2** — Add button and wire to API; test full flow.
