# NeuroCare Connect

A web-based clinical research management and data-collection platform supporting a Pharm.D neuropathic pain research workflow. It has a public site (home page, Study page, Study Team page), a patient area, and a restricted Research Portal for the study team.

## Technology

- TanStack Start (React 19, TanStack Router, TanStack Query), Vite, TypeScript
- Tailwind CSS v4, Radix UI primitives, lucide-react icons, Recharts
- Supabase (Postgres, Auth, row-level security) via `@supabase/supabase-js`
- Drizzle (schema/migration tooling), Zod (validation), pdf-lib (PDF reports)
- Vitest (tests)

## Installation

Requires Node.js 20+ and Bun (a `bun.lock` lockfile is included; npm also works).

```sh
bun install        # or: npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values from your backend project:

| Variable | Used by |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Browser |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | Server |

Server-only secrets (for example a service-role key used by admin functions) must be supplied as environment variables on the server and are never stored in this repository.

## Development

```sh
bun run dev        # http://localhost:8080
bun run test       # unit tests
```

## Build

```sh
bun run build
bun run preview
```

## Database

- `supabase/migrations/` — the applied SQL migrations (tables, RLS policies, triggers, functions), in order.
- `supabase/config.toml` — backend project configuration.
- `drizzle/schema.ts` and `drizzle/migrations/` — Drizzle schema and migration history.

## Project structure

- `src/routes/` — pages (file-based routing): public pages, `patient/`, `research/login`, and `_authenticated/` (signed-in patient and Research Portal pages), plus `api/` server routes.
- `src/components/` — UI building blocks (`ui/`, `layout/`, `research/`, `participants/`, `auth/`, `brand/`, `common/`).
- `src/lib/` — study logic, lifecycle rules, clinical instruments, analytics, Excel export, PDF reports and server functions.
- `src/content/study-team.ts` — editable text for the Study Team page.
- `src/config/branding.ts` — institution names, contact details and logos.
- `src/integrations/supabase/` — backend clients and auth middleware.
- `public/` — static files (favicon, robots.txt).

## Security note

Secret credentials must be supplied through environment variables and must never be committed to source control. Access to research data is enforced by database row-level security.
