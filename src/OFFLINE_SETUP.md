# NeuroCare Connect — run locally
1. Install Bun (https://bun.sh) or Node 20+.
2. `bun install`
3. Copy `.env.example` to `.env` and fill in your backend URL and publishable key.
4. `bun run dev` and open http://localhost:8080
Database schema: `supabase/migrations/*.sql` (apply in filename order to a fresh Postgres/Supabase project).
Public pages (home, study, study team, patient education) work without a backend; the research portal needs one.
