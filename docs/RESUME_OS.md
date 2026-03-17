# Resume OS (Flagship)

Resume OS is the flagship resume experience, aligned with the **Resume SaaS Operating Manual**: ATS-safe, human-sounding, and defensible. It adds JD-aware analysis, scoring, bullet suggestions, and audit on top of your existing resume data.

---

## Resume vs Resume OS

| | **Resume** | **Resume OS (beta)** |
|---|------------|----------------------|
| **Purpose** | Stable editor and PDF export. Section-based (Summary, Skills, Experience, Education). | JD-aware workspace: analyze a job description, score your resume, get suggested bullets and an audit. |
| **Where** | `/dashboard/resume` | `/dashboard/resume-os` |
| **Data** | `ResumeContent.sections` (existing schema). | Same underlying resume for now; uses `lib/resume/model` types (e.g. `CandidateProfile`, `JobDescriptionProfile`) for scoring and suggestions. |
| **Tailoring** | Per-section “Tailor for a job” → summary, keywords, bullets in a modal; apply to section. | Paste full JD → “Analyze job description” → “Tailor resume to this job” → match score, audit, suggested bullets (copy into experience). |
| **Export** | PDF via “Download PDF” / `GET /api/resumes/[id]/export?format=pdf`. | Uses same export today; plan: version (master / jd-specific) and layout (ATS / visual) options. |
| **Roadmap** | Stays as primary editor; no structural change. | Future: evidence-first profile, versions (Master / JD / ATS / human), migration from current sections. |

Use **Resume** for day-to-day editing and PDFs. Use **Resume OS** when you have a target job and want JD-specific scoring, bullets, and audit.

---

## What’s implemented

- **Model & validation:** `lib/resume/model.ts`, `lib/validations/resume-os.ts`, `lib/validations/ai.ts`.
- **APIs:**
  - `POST /api/ai/jd-profile` — paste JD → structured `JobDescriptionProfile`.
  - `POST /api/ai/resume-score` — profile + JD profile + resume content → general score, match score, keyword coverage.
  - `POST /api/ai/bullets` — generate or humanize bullets from facts + JD profile.
  - `POST /api/ai/resume-audit` — resume text (+ optional JD) → ATS, JD alignment, experience, human, defensibility, risk flags.
- **UI:** `/dashboard/resume-os` — target job panel (analyze JD), resume preview, “Tailor resume to this job” (score + bullets + audit in parallel), suggested bullets to copy.

---

## What’s next (from plan)

1. **Export:** Version (e.g. master vs jd-[id]) and layout (ATS vs visual) support on `/api/resumes/[id]/export`; optional helpers in `lib/resume/export.ts`.
2. **Migration:** One-way “Upgrade to Resume OS”: map current `ResumeContent.sections` into `CandidateProfile` and first Master version (when user first uses Resume OS or via explicit action).
3. **Polish / guardrails:** Align prompts and UI with Operating Manual (no silent fabrications, clear “suggested” labels, production-ready errors and empty states).

---

## References

- **Implementation status:** `IMPLEMENTATION_STATUS.md` (§ Flagship Resume OS, § In Progress, § Immediate Next Steps).
- **Execution plan:** `.cursor/plans/` — Flagship Resume OS plan file (do not edit; use for task tracking).
- **Resume scoring (legacy):** `docs/RESUME_SCORING.md` if present; Resume OS uses `lib/resume-score` and the new APIs above.
