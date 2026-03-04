# Setup Guide - Job Application Automation System

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

The database will be automatically created on first run. The SQLite database file `dev.db` will be created in the project root.

### 3. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

For MVP (Phase 1), you can start without Gmail/Sheets API credentials. The app will work for manual job entry.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Gmail API Setup (Phase 2)

To enable email monitoring:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - Scopes: Add `https://www.googleapis.com/auth/gmail.readonly`
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/gmail/callback`
7. Copy Client ID and Client Secret to `.env.local`
8. Use OAuth flow to get refresh token (we'll add a setup page for this)

## Google Sheets API Setup (Phase 3)

To enable Google Sheets sync:

1. In the same Google Cloud project, enable **Google Sheets API**
2. Add scope: `https://www.googleapis.com/auth/spreadsheets`
3. Create OAuth 2.0 Client ID (or reuse existing)
4. Copy credentials to `.env.local`
5. Create a Google Sheet and copy its ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Copy `SHEET_ID` to `.env.local` as `GOOGLE_SHEETS_ID`

## Database Management

### View Database

```bash
npm run db:studio
```

This opens Drizzle Studio in your browser where you can view and edit data.

### Generate Migrations

```bash
npm run db:generate
```

### Run Migrations

```bash
npm run db:migrate
```

## Project Structure

```
dev-automate/
├── app/
│   ├── api/              # API routes
│   │   └── jobs/         # Job CRUD endpoints
│   ├── page.tsx          # Dashboard home
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   └── jobs/             # Job-related components
├── lib/
│   ├── db/               # Database schema and connection
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
└── types/                # TypeScript type definitions
```

## Features Implemented

### ✅ Phase 1: Foundation
- [x] Next.js + shadcn/ui setup
- [x] Database schema with Drizzle ORM
- [x] Job CRUD API endpoints
- [x] Job tracking dashboard UI
- [x] Add/Edit/Delete job applications
- [x] Status filtering
- [x] Responsive design

### ⏳ Phase 2: Email Integration (Next)
- [ ] Gmail API OAuth setup page
- [ ] Email monitoring service
- [ ] Builtin email detection
- [ ] Job link extraction
- [ ] Automatic job creation from emails

### ⏳ Phase 3: Google Sheets Sync (Next)
- [ ] Google Sheets API integration
- [ ] Sync service
- [ ] Real-time updates
- [ ] Manual sync button

### ⏳ Phase 4: Automation (Future)
- [ ] Playwright setup
- [ ] Form detection
- [ ] Auto-fill logic
- [ ] Resume/CV handling

## Troubleshooting

### Database Issues

If you encounter database errors:
1. Delete `dev.db` file
2. Restart the dev server (database will be recreated)

### Port Already in Use

If port 3000 is already in use:
```bash
# Kill the process
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### TypeScript Errors

Run type checking:
```bash
npx tsc --noEmit
```

## Next Steps

1. **Test the current features**: Add some manual job applications
2. **Set up Gmail API**: Follow the Gmail API setup guide above
3. **Set up Google Sheets**: Follow the Sheets API setup guide above
4. **Customize**: Modify the UI, add more fields, etc.

## Support

For issues or questions, check the `ARCHITECTURE.md` file for detailed system design.
