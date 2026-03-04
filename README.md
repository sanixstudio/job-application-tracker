# Job Application Automation System

Automate and track your job application process. Monitor Gmail for Builtin job emails, extract job links, manage applications, and sync with Google Sheets.

## 🚀 Features

### ✅ Phase 1: Foundation (Completed)
- **Job Tracking Dashboard**: Beautiful UI built with shadcn/ui
- **CRUD Operations**: Add, edit, delete, and view job applications
- **Status Management**: Track applications through interview stages
- **Filtering**: Filter jobs by status (Applied, Interview, Offer, Rejected, etc.)
- **Database**: SQLite database with Drizzle ORM (easily migratable to PostgreSQL)
- **Responsive Design**: Works on desktop and mobile

### ⏳ Phase 2: Email Integration (Next)
- Gmail API integration for email monitoring
- Automatic Builtin job email detection
- Job link extraction from emails
- Scheduled email checks (twice daily)

### ⏳ Phase 3: Google Sheets Sync (Next)
- Sync applications to Google Sheets
- Real-time updates
- Manual sync option

### ⏳ Phase 4: Automation (Future)
- Playwright-based form filling
- Resume/CV upload automation
- Confirmation email detection

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod validation
- **Database**: SQLite (local) / PostgreSQL (production)
- **ORM**: Drizzle ORM
- **Email**: Gmail API (googleapis)
- **Automation**: Playwright
- **Sheets**: Google Sheets API

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   For MVP, you can start without Gmail/Sheets credentials. The app works for manual job entry.

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Management

View your database:
```bash
npm run db:studio
```

Generate migrations:
```bash
npm run db:generate
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design decisions
- **[SETUP.md](./SETUP.md)** - Detailed setup guide for Gmail and Google Sheets APIs

## 🎯 Usage

1. **Add a Job Application:**
   - Click "Add Job" button
   - Fill in job details (title, company, URL, etc.)
   - Select status
   - Save

2. **View Applications:**
   - See all applications on the dashboard
   - Filter by status using the dropdown
   - Click "View Job" to open job posting

3. **Edit/Delete:**
   - Click "Edit" on any job card to update details
   - Click "Delete" to remove an application

## 🔐 Environment Variables

See `.env.example` for required environment variables. For MVP, only database configuration is needed.

## 📁 Project Structure

```
dev-automate/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── jobs/          # Job CRUD endpoints
│   ├── page.tsx           # Dashboard home
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   └── jobs/              # Job-related components
├── lib/
│   ├── db/                # Database schema and connection
│   ├── services/         # Business logic (coming soon)
│   └── utils/            # Utility functions
└── types/                 # TypeScript definitions
```

## 🚧 Roadmap

- [x] Phase 1: Foundation & UI
- [ ] Phase 2: Gmail Integration
- [ ] Phase 3: Google Sheets Sync
- [ ] Phase 4: Form Automation
- [ ] Phase 5: SaaS Features

## 📝 License

MIT

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📧 Support

For setup help, see [SETUP.md](./SETUP.md). For architecture questions, see [ARCHITECTURE.md](./ARCHITECTURE.md).
