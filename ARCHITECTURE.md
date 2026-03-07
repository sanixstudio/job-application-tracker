# Job Application Automation System - Architecture Plan

## Project Overview
Automate the job application process by monitoring Gmail for Builtin job emails, extracting job links, automating form submissions, and tracking applications in Google Sheets.

## Current implementation (Phase II complete)

**Source of truth for status:** `IMPLEMENTATION_STATUS.md`. **Roadmap:** `docs/PRODUCT_AND_ENGINEERING_PLAN.md`.

- **Auth:** Clerk (sign-in, sign-up). Protected routes: `/dashboard(.*)` via middleware.
- **Database:** Neon PostgreSQL, Drizzle ORM. Tables: `applications`, `resumes`, `user_settings`, `email_tracking`.
- **App layout:** Sidebar (shadcn-style) with nav: Dashboard, Applications, Resume, Email, Settings, Home. Sidebar is in document flow on desktop (sticky, full height); sheet drawer on mobile. Main content area does not overlap sidebar.
- **Routes:** `/dashboard` (overview), `/dashboard/applications` (Application Tracker: Kanban + list view), `/dashboard/resume`, `/dashboard/email`, `/dashboard/settings`. API: `/api/jobs`, `/api/resumes`, `/api/analytics`, `/api/profile/checklist`, `/api/email-suggestions`, `/api/ext/save`, `/api/inbound/email`, etc.
- **Applications page:** Kanban board (@dnd-kit) with columns Applied → Interviewing → Offer → Rejected → Withdrawn; drag-and-drop updates status via `PUT /api/jobs/[id]`. View toggle (Board/List), date filter (All time / Last 90 days). List view uses existing JobList grid.
- **Features shipped:** Job CRUD, resume builder + PDF export, AI resume tailoring, Chrome extension save API, analytics dashboard, email parsing (inbound + suggestions), profile checklist (job-ready score, LinkedIn/GitHub URLs).

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router) - Already set up ✅
- **UI Components**: shadcn/ui - Already set up ✅
- **Styling**: Tailwind CSS v4 - Already set up ✅
- **State Management**: Zustand (lightweight, perfect for this use case)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query)

### Backend
- **API Routes**: Next.js API Routes (serverless functions)
- **Database**: 
  - **Local Dev**: SQLite with Drizzle ORM
  - **Production/SaaS**: PostgreSQL (Supabase/PlanetScale)
- **Email**: Gmail API (googleapis)
- **Automation**: Playwright (for form filling)
- **Sheets Integration**: Google Sheets API
- **Scheduling**: node-cron (local) / Vercel Cron Jobs (production)

### Infrastructure
- **Authentication**: NextAuth.js (for future SaaS)
- **Environment Variables**: .env.local
- **Deployment**: Vercel (seamless Next.js deployment)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Dashboard                         │
│  (View applications, manage settings, trigger manual sync)  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Email Service │  │ Job Service  │  │ Sheets Sync  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Gmail API   │ │  Database    │ │ Google Sheets│
│              │ │  (SQLite/     │ │     API      │
│              │ │   PostgreSQL)│ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │
        ▼
┌──────────────┐
│  Playwright  │
│  Automation  │
│  Engine      │
└──────────────┘
```

## Core Features

### Phase 1: MVP (Personal Use)
1. ✅ **Email Monitoring Service**
   - Connect to Gmail API
   - Filter Builtin job emails
   - Extract job links from emails
   - Schedule checks (twice daily)

2. ✅ **Job Application Tracker**
   - Database schema for jobs
   - CRUD operations
   - Status tracking (applied, interview, offer, rejected)

3. ✅ **Google Sheets Integration**
   - Sync applications to Google Sheets
   - Real-time updates

4. ✅ **Dashboard UI**
   - View all applications
   - Filter by status
   - Manual job entry
   - Settings page

### Phase 2: Automation (Advanced)
5. ⏳ **Form Filling Automation**
   - Playwright automation
   - Resume/CV upload
   - Cover letter generation
   - Smart form detection

6. ⏳ **Confirmation Email Detection**
   - Monitor for application confirmations
   - Auto-update status

### Phase 3: SaaS Ready
7. ⏳ **Multi-User Support**
   - Authentication system
   - User isolation
   - Subscription management

8. ⏳ **Advanced Features**
   - Multiple email accounts
   - Custom job board integrations
   - Analytics & insights
   - Email templates

## Database Schema

```sql
-- Applications Table
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_url TEXT NOT NULL,
  application_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  -- Status: applied, interview_1, interview_2, interview_3, offer, rejected, withdrawn
  applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source TEXT, -- 'builtin', 'manual', 'other'
  email_id TEXT, -- Gmail message ID
  notes TEXT,
  salary_range TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Tracking Table
CREATE TABLE email_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_id TEXT NOT NULL UNIQUE,
  from_address TEXT,
  subject TEXT,
  received_date TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  job_links TEXT[], -- Array of extracted job URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  gmail_address TEXT,
  sheets_id TEXT,
  check_frequency TEXT DEFAULT 'twice_daily',
  auto_apply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Routes Structure

```
/api
  /auth
    /gmail          - Gmail OAuth setup
    /sheets         - Google Sheets OAuth setup
  /jobs
    GET /            - List all jobs
    POST /            - Create new job
    GET /[id]        - Get job details
    PUT /[id]        - Update job
    DELETE /[id]     - Delete job
  /emails
    GET /            - List processed emails
    POST /check      - Manual email check trigger
    GET /[id]        - Get email details
  /sheets
    POST /sync       - Sync to Google Sheets
    GET /status      - Get sync status
  /automation
    POST /apply      - Trigger application automation
    GET /status      - Get automation status
```

## File Structure

```
dev-automate/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard home
│   │   ├── jobs/
│   │   │   ├── page.tsx      # Jobs list
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Job details
│   │   └── settings/
│   │       └── page.tsx      # Settings page
│   ├── api/
│   │   ├── jobs/
│   │   ├── emails/
│   │   ├── sheets/
│   │   └── automation/
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn components
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobForm.tsx
│   │   └── JobList.tsx
│   └── dashboard/
│       ├── StatsCard.tsx
│       └── StatusFilter.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── index.ts           # DB connection
│   │   └── migrations/        # DB migrations
│   ├── services/
│   │   ├── gmail.ts           # Gmail API service
│   │   ├── sheets.ts           # Google Sheets service
│   │   ├── email-parser.ts    # Email parsing logic
│   │   └── automation.ts      # Playwright automation
│   ├── utils/
│   │   └── utils.ts           # Already exists
│   └── store/
│       └── jobStore.ts         # Zustand store
├── types/
│   └── index.ts               # TypeScript types
└── .env.local                 # Environment variables
```

## Environment Variables

```env
# Gmail API
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_USER_EMAIL=sanixstudio@gmail.com

# Google Sheets API
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_SHEETS_REFRESH_TOKEN=
GOOGLE_SHEETS_ID=

# Database
DATABASE_URL=file:./dev.db  # SQLite for local

# NextAuth (for future SaaS)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# App Config
APP_URL=http://localhost:3000
```

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Project setup with Next.js + shadcn/ui
- [ ] Database setup with Drizzle ORM
- [ ] Basic UI components
- [ ] Job CRUD operations

### Phase 2: Email Integration
- [ ] Gmail API setup
- [ ] Email monitoring service
- [ ] Job link extraction
- [ ] Email tracking

### Phase 3: Google Sheets Sync
- [ ] Google Sheets API setup
- [ ] Sync service
- [ ] Real-time updates

### Phase 4: Automation
- [ ] Playwright setup
- [ ] Form detection
- [ ] Auto-fill logic
- [ ] Resume/CV handling

### Phase 5: Polish & Scale
- [ ] Error handling
- [ ] Logging & monitoring
- [ ] Multi-user support
- [ ] SaaS features

## Security Considerations

1. **Credentials Storage**: Use environment variables, never commit secrets
2. **OAuth Tokens**: Store securely, refresh automatically
3. **Rate Limiting**: Implement for API routes
4. **Input Validation**: Zod schemas for all inputs
5. **SQL Injection**: Use ORM (Drizzle) to prevent
6. **XSS**: React automatically escapes, but validate inputs

## Next Steps

1. Set up database with Drizzle ORM
2. Create database schema
3. Build basic UI components
4. Implement job CRUD API
5. Set up Gmail API integration
6. Build email monitoring service
7. Create Google Sheets sync
8. Add automation engine
