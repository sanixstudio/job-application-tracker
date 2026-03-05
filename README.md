# Trackr — Job Application Tracker

Track and manage your job applications in one place. Sign in with Clerk, store data in Neon PostgreSQL, and keep your pipeline visible on a single dashboard.

## Features

- **Landing page** — Clear value proposition and CTAs (Start tracking / Sign in)
- **Authentication** — Clerk (sign-in, sign-up, protected dashboard)
- **Dashboard** — Stats (total, applied, interviews, offers, rejected) and full job list
- **CRUD** — Add, edit, delete, and filter job applications
- **Status pipeline** — Applied → Interview 1–3 → Offer / Rejected / Withdrawn
- **Database** — Neon PostgreSQL with Drizzle ORM
- **Validation** — Zod on API and React Hook Form on the client

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4 (use canonical variable syntax in classes: e.g. `bg-(--card)` not `bg-[var(--card)]`)
- **Auth**: Clerk
- **Data**: TanStack React Query, React Hook Form, Zod
- **Database**: Neon PostgreSQL, Drizzle ORM

## Getting Started

### Prerequisites

- Node.js 18+
- [Clerk](https://clerk.com) account (free tier)
- [Neon](https://neon.tech) PostgreSQL database (free tier)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   - **Clerk**: Create an application at [dashboard.clerk.com](https://dashboard.clerk.com), add your app URL, and copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
   - **Neon**: Create a project at [neon.tech](https://neon.tech), copy the connection string into `DATABASE_URL`.

3. **Run migrations**
   ```bash
   npm run db:migrate
   ```
   (Requires `DATABASE_URL` in `.env.local`.)

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Landing: [http://localhost:3000](http://localhost:3000)
   - Sign in / Sign up: `/sign-in`, `/sign-up`
   - Dashboard (protected): [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### Database

- **Generate migrations** (after schema changes):
  ```bash
  npm run db:generate
  ```
- **Apply migrations**:
  ```bash
  npm run db:migrate
  ```
- **Open Drizzle Studio**:
  ```bash
  npm run db:studio
  ```
  Set `DATABASE_URL` in `.env.local` before running.

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[SETUP.md](./SETUP.md)** - Detailed setup guide for Gmail and Google Sheets APIs

## 🎯 Usage

1. **Save from browser (Chrome extension):** Generate an API key on the dashboard (**Save from browser** → **Generate API key**), then load the Chrome extension from the `extension/` folder ([extension/README.md](./extension/README.md)) and paste the key. Open any job listing tab, click the extension, fill title/company, and click **Save to Trackr**.

2. **Add a Job Application:**
   - Click "Add Job" button
   - Fill in job details (title, company, URL, etc.)
   - Select status
   - Save

3. **View Applications:**
   - See all applications on the dashboard
   - Filter by status using the dropdown
   - Click "View Job" to open job posting

4. **Edit/Delete:**
   - Click "Edit" on any job card to update details
   - Click "Delete" to remove an application

## Environment Variables

| Variable | Description |
|--------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Optional; default redirect after sign-in (e.g. `/dashboard`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Optional; default redirect after sign-up |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | Optional. OpenAI API key for Resume "Tailor for a job" suggestions; omit to disable (API returns 503). |

See `.env.example` for a template.

## Project Structure

```
extension/                 # Chrome extension (load unpacked) — save jobs from any tab
app/
├── api/jobs/              # Job CRUD API (auth + Zod)
├── dashboard/             # Protected dashboard (SSR stats + client JobList)
├── sign-in/[[...sign-in]]/ # Clerk sign-in
├── sign-up/[[...sign-up]]/ # Clerk sign-up
├── page.tsx               # Landing page
└── layout.tsx             # Root layout (ClerkProvider + Query)
components/
├── ui/                    # shadcn/ui
└── jobs/                  # JobList, JobCard, JobForm (client)
lib/
├── db/                    # Drizzle schema + Neon connection
└── validations/           # Zod schemas (job create/update)
```

## 📝 License

MIT

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📧 Support

For setup help, see [SETUP.md](./SETUP.md). For architecture questions, see [ARCHITECTURE.md](./ARCHITECTURE.md).
