# Precision Coach CRM

A private, single-admin CRM for Precision Coach's coaching business. See `_build_plan/prd.html` for the full product plan and milestone breakdown.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS, Prisma + PostgreSQL, email/password auth (single admin, no public signup).

## Local development

1. Start PostgreSQL and create a database (adjust to your setup):
   ```bash
   service postgresql start
   sudo -u postgres psql -c "CREATE ROLE app WITH LOGIN PASSWORD 'app';"
   sudo -u postgres createdb -O app precision_coach_crm
   ```
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -hex 32`), and `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` for the seeded admin login.
3. Install dependencies and set up the database:
   ```bash
   npm install
   npx prisma migrate dev
   ```
   If the admin user doesn't get seeded automatically, run `npx prisma db seed`.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in with the admin credentials from your `.env`.

## Notes

- `_build_plan/` is temporary planning documentation for the initial build — see `AGENTS.md` for details. It's not read by any application code and is expected to be deleted once the initial milestones ship.
- Route protection lives in `src/proxy.ts` (Next.js 16's renamed `middleware.ts` convention), not `middleware.ts`.
