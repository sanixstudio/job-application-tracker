# Architecture (short reference)

**Full document:** See repository root **[ARCHITECTURE.md](/ARCHITECTURE.md)** for the complete architecture plan, schema, and API layout.

## High-level

- **Next.js 16** App Router. **Clerk** for auth. **Drizzle + Neon** for persistence. **Cron / server** for background-style work where applicable.
- **Dashboard** is the main authenticated area: overview (stats, analytics, quick links), **Applications** (job list CRUD), **Resume** (resume builder + tailor + export), **Email** (forward address + suggestions), **Settings** (e.g. extension API key).
- **API:** REST-style routes under `app/api/`; server-side validation (Zod) and authz on every protected route. DB access only in server code.

## Data flow

- User actions → Client components / forms → API routes (or server actions) → Drizzle + Neon. Server state is cached with TanStack Query on the client where needed.
- No DB or server secrets in client bundles. Env and API keys only on the server; extension key is managed in Settings and used by the save-from-browser flow.

## Where to look

| Topic        | Location |
|-------------|----------|
| Stack & deps| `package.json`, `.cursor/rules/stack.mdc` |
| DB schema   | `lib/db/schema.ts`, migrations |
| API routes  | `app/api/*` |
| Auth        | Clerk middleware, `app/sign-in`, `app/sign-up` |
| Full architecture | **ARCHITECTURE.md** (repo root) |
