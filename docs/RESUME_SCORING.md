# Resume Scoring Methodology

This document describes how the Job Application Tracker scores resumes (0–100) and provides actionable feedback. The logic is based on research from ATS vendors, recruiter scorecards, and resume best-practice guides.

---

## Two Ways to Score Your Resume

We provide **two scoring modes**. Both are available on the Resume page; the UI explains both and recommends using a job description when you’re applying.

### 1. General quality (no job description)

- **What it is:** A score based only on your resume — sections, impact bullets, quantifiable results, summary quality, and skills depth.
- **When to use it:** When you’re building or polishing your resume and don’t have a specific job in mind.
- **What it measures:** Best-practice completeness and impact (see criteria below). It does **not** measure fit to a particular role.

### 2. Match to job description (recommended when applying)

- **What it is:** In addition to the general score, you paste a **job description** and get a **match score** showing how well your resume aligns with that posting.
- **When to use it:** Whenever you’re applying to a role. Paste the job description into the “Score against a job description” area to see the match score.
- **What it measures:** Keyword overlap between the job description and your resume (summary, skills, experience). ATS and recruiters often filter by keywords; this score helps you see how well you’re matching.
- **Recommendation:** For a more realistic idea of how your resume will perform for a given application, always use the job-description option when you have the posting.

The app always shows the **general quality** score. When you paste a job description, it also shows the **match to job description** score and keyword count (e.g. “X of Y keywords from the job description appear in your resume”).

---

## Overview (General Score)

The **general** score reflects how well a resume aligns with **ATS** and **human recruiter** expectations for structure and impact. Over 75% of large employers use ATS to filter candidates before human review; resumes that score well on both technical parsing and content quality have higher callback rates.

**Score bands (general and match both use 0–100):**

- **70–100**: Strong — Well-structured and impact-focused (general), or strong key-term match (match). General score is calibrated so 70+ requires 70%+ impact bullets, solid summary, and 15+ skills.
- **40–69**: Good start — Core sections present (general), or moderate match (match). Match score: 60–80% of key terms is considered a good ATS fit in industry research.
- **0–39**: Needs work — Missing key sections or impact (general), or low match (match). Non-resume documents are capped at 40 with a message to upload a real resume.

---

## Research Sources

Our scoring criteria draw from:

1. **ATS scoring metrics** (Resumly, Huru, PassTheScan) — Keyword match, formatting, experience relevance, skills, readability, contact data. ATS typically weight **hard skills, technologies, and role requirements** more than generic phrasing (e.g. "communication", "detail-oriented"); we mirror this by excluding generic JD words and capping at ~20 high-value terms, with 60–80% match as a realistic "good fit" band.
2. **Recruiter scorecards** (4 Corner Resources, Hiration) — Structured evaluation: content relevance, quantified achievements, ATS compatibility.
3. **Resume checklists** (NovoResume, Monster, Teal, Career.io) — Section completeness, professional summary (2–4 sentences), action verbs, metrics.
4. **Action verbs & impact** (Rezi, Resumly, Elite Resumes) — Strong verbs (led, implemented, optimized) + quantifiable results improve ATS match and callback rates.
5. **Length & readability** (ResumeGenius, TruResume) — 1–2 pages, 3–5 bullets per role, concise sentences.

---

## Scoring Criteria & Weights


| Criterion            | Weight | What we measure                                     |
| -------------------- | ------ | --------------------------------------------------- |
| Section completeness | 25%    | Summary, Skills, Experience present and substantive |
| Impact bullets       | 30%    | Action verbs, quantifiable results, bullet quality  |
| Quantifiable metrics | 25%    | Numbers, %, $, scale in experience                  |
| Summary quality      | 10%    | Length (2–4 sentences), clarity                     |
| Skills depth         | 10%    | Number and relevance of skills                      |


---

## 1. Section Completeness (25 points)

**What we check:**

- **Summary**: Present and at least ~20 characters (not a placeholder).
- **Skills**: Present and at least a few characters (not empty).
- **Experience**: At least one **role** with **company** or **job title** (and content). Entries with only bullet text and no company/title do not count as experience (avoids rewarding non-resume documents that get parsed into fake sections).

**Scoring:**

- 3/3 sections present and substantive → 25 points
- 2/3 → ~17 points
- 1/3 → ~8 points
- 0/3 → 0 points

**Feedback:**

- Missing summary: "Add a professional summary (2–4 sentences) at the top."
- Missing skills: "Add a Skills section with relevant technologies and tools."
- Missing experience: "Add at least one experience entry with bullet points."

---

## 2. Impact Bullets (30 points)

**What we check:**

- Only bullets from **experience/project entries that have a company or job title** are counted (same as section completeness).
- Each bullet starts with a **strong action verb** (e.g. Led, Implemented, Achieved, Optimized, Delivered).
- Bullets include **quantifiable results** (numbers, %, $) or sufficient **substance** (length + context).
- Bullets are not too short (vague) or too long (hard to scan).

**Action verb formula:** `Action Verb + What You Did + Quantifiable Result`

**Strong action verbs** (examples): achieved, built, created, delivered, designed, developed, drove, established, improved, increased, implemented, led, managed, optimized, reduced, scaled, spearheaded, transformed, launched, orchestrated, streamlined, resolved, collaborated, mentored.

**Weak patterns to avoid:** "Responsible for", "Helped with", "Worked on", "Was involved in".

**Scoring:**

- Ratio of high-impact bullets to total bullets. **Stricter curve:** full 30 points only when ≥ 70% of bullets are high-impact; 30–70% gets partial credit; below 30% gets 0 for this criterion.
- High-impact = action verb + (metrics OR substantial length > 50 chars).
- Target: **≥ 70%** of bullets are high-impact for a strong score.

**Feedback:**

- Below 70%: "Aim for 70%+ of bullets to start with action verbs (e.g. Led, Improved, Delivered) and include results or metrics."

---

## 3. Quantifiable Metrics (25 points)

**What we check:**

- Presence of **numbers, percentages, dollar amounts**, or scale (e.g. "10K users", "reduced by 20%").
- Metrics in experience/projects sections carry the most weight.

**Patterns we detect:**

- Percentages: `15%`, `increased by 20%`, `reduced churn by 10%`
- Money: `$1M`, `saved $50K`, `budget of $200K`
- Scale: `500 users`, `team of 8`, `3x growth`
- Time: `in 6 months`, `within 3 quarters`

**Scoring:**

- At least one experience section with metrics → full points.
- Experience present but no metrics → 0 points for this criterion.

**Feedback:**

- No metrics: "Add quantifiable results (percentages, numbers, time/cost saved) to strengthen your experience bullets."

---

## 4. Summary Quality (10 points)

**What we check:**

- Summary length: **80–300 characters** is ideal (2–4 sentences). Research suggests ~80+ chars for a real 2–4 sentence summary.
- Too short (< 80): Likely a placeholder or one-liner.
- Too long (> 300): Hard to scan; recruiters spend ~7 seconds on initial review.

**Scoring:**

- 80–300 chars → 10 points
- 20–80 chars → 4 points (partial)
- < 20 or missing → 0 points
- > 300 chars → 6 points (good but could be tighter)

**Feedback:**

- Too short: "Expand your summary to 2–4 clear sentences (roughly 80–300 characters)."
- Too long: "Consider shortening your summary to 2–4 sentences for quick scanning."

---

## 5. Skills Depth (10 points)

**What we check:**

- Number of **distinct skills** (comma or newline separated). ATS and recruiters often expect 10–15+ relevant skills.
- Target: **8+ skills** for a solid section; **15+** for strong.

**Scoring:**

- 15+ skills → 10 points
- 8–14 skills → ~6.5 points
- 1–7 skills → ~3.5 points
- 0 skills → 0 points

**Feedback:**

- Few skills: "List at least 8–15 relevant skills; include technologies and tools recruiters and ATS search for."

---

## 6. Resume Relevance (score cap)

**What we check:**

- **On upload (parse API):** The same AI that structures the document also classifies it. The model returns `is_resume: true/false`—true only when the document is clearly a professional resume/CV (career history, skills, education). This avoids false positives from words like "story" or "character" that appear in real resumes.
- **Fallback (live editing / no AI flag):** When scoring without an AI classification (e.g. after the user edits), we use a keyword-based check: resume-like phrases vs. non-resume phrases (e.g. "mullet", "recipe", "film review"), with a threshold so one stray word doesn’t cap the score.
- If the content **does not look like a resume**, the score is **capped at 40** and we show: *"This doesn't appear to be a resume. Upload a professional resume (CV) with experience, skills, and education for a meaningful score."*

This keeps the score reliable when users upload the wrong file: only real resumes can score in the 70+ range.

---

## Match-to-Job Score (When Job Description Is Provided)

When you paste a job description, we compute a **match score** in addition to the general score. This is calibrated to **simulate typical ATS behavior**: most ATS weight **skills, technologies, and role-relevant terms** rather than every word in the posting. Industry guidance suggests targeting **10–20 key terms** and **60–80% match** for a good fit; 70%+ is often cited as a common bar.

**How it works:**

1. **High-value keyword extraction:** We extract candidate keywords from the job description (single words, length ≥ 4), excluding:
   - Common stop words (the, required, experience, etc.).
   - **Generic JD phrasing** that ATS typically don’t treat as skills: e.g. "management", "communication", "environment", "stakeholders", "detail-oriented", "fast-paced". This keeps the list focused on **skills and technologies**.
   We cap at **20 keywords** (top by frequency) so the score reflects alignment on a small set of important terms.
2. **Resume text:** We build one searchable text from your resume (summary, skills, experience/projects titles and descriptions).
3. **Matching:** Each keyword is checked against the resume text (case-insensitive, spaces/hyphens normalized). We also accept **synonyms** so common variants count as a match (e.g. "JavaScript" in JD and "JS" in resume, "React" and "ReactJS", "Node.js" and "Node", "machine learning" and "ML").
4. **Match score:** `matchScore = (keywords found / total keywords) × 100`, capped at 100.

**Feedback:**

- No keywords extracted: "No high-value keywords could be extracted from the job description. Paste a longer description with skills/requirements for a match score."
- Below 60%: "X of Y key terms from the job description appear in your resume (aim for 60–80% for a strong ATS fit). Add relevant skills and technologies from the posting."
- 60–75%: "X of Y key terms match. Consider adding a few more skills or technologies from the job description to improve match."
- 75%+: "Strong match: X of Y key terms from the job description appear in your resume."

The general quality score is **independent** of the job description. The match score is **only** about key-term overlap with the pasted job. Use both: general for overall resume health, match for application-specific tuning.

---

## Implementation Notes

- **Projects section**: Treated like Experience for bullets and metrics when present.
- **Education**: Optional; not scored. Including it does not change the score.
- **Contact info**: Not parsed in our current schema; not scored. (Future: could add parsing for email/phone.)
- **Two modes**: The Resume page shows **general quality** (always) and **match to job description** (when the user pastes a JD). The "Tailor for a job" feature uses the same JD for AI suggestions; scoring with JD uses the same pasted text for the match score.

---

## How to Improve Your Score

1. **Add missing sections** — Summary, Skills, Experience are essential.
2. **Rewrite bullets** — Start each with an action verb; add numbers, %, or scale.
3. **Expand summary** — 2–4 sentences highlighting title, experience, and key achievements.
4. **List more skills** — Include technologies, tools, and soft skills relevant to your target roles.
5. **Use the Tailor feature** — Paste a job description to get keyword and summary suggestions; apply them and save.

---

## References

- [Resumly: ATS Resume Scoring Metrics](https://www.resumly.ai/blog/how-to-understand-ats-resume-scoring-metrics)
- [Resumly: Impact-Focused Bullet Points](https://www.resumly.ai/blog/write-impactfocused-bullet-points-with-strong-action-verbs)
- [4 Corner Resources: Resume Screening Scorecard](https://www.4cornerresources.com/blog/resume-screening-scorecard/)
- [Hiration: Resume Critique Rubric](https://www.hiration.com/blog/resume-critique-rubric-career-centers-higher-ed/)
- [NovoResume: Resume Checklist](https://novoresume.com/career-advice/resume-checklist)
- [ResumeGenius: Resume Length](https://resumegenius.com/blog/resume-help/how-long-should-resume-be)
- [Rezi: Resume Action Words](https://www.rezi.ai/posts/resume-action-words)

