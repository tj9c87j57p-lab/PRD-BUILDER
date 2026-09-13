## What's new in the app

- You can sign in at `/login` with your email and password — no public signup, just the one seeded admin account.
- After signing in you land on the Precision Coach dashboard shell: black background, gold accent, off-white text, sidebar navigation.
- The sidebar links to Dashboard, Contacts, Deals, Tasks, Bookings, and Leads (all still empty placeholders — real functionality comes in later milestones).
- The sidebar collapses into a mobile menu on small screens and shows your name plus a "Log out" button.
- Trying to visit any page while signed out — even by typing the URL directly — bounces you back to `/login`. Logging out does the same.

## What was built

- **Scaffold:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4, `src/` layout, via `create-next-app`.
- **Database:** Prisma 7.10.0 + `@prisma/client` 7.10.0 + `@prisma/adapter-pg`, PostgreSQL. Single `User` model (`id`, `email`, `passwordHash`, `name`, timestamps). Migration `prisma/migrations/20260913203742_init`.
- **Config:** `prisma.config.ts` (Prisma 7's config now lives here, not in `package.json`) — points at the schema, migrations folder, seed command, and the `DATABASE_URL` datasource for Migrate/introspection.
- **Auth:** `iron-session` (encrypted cookie, `pcc_session`) + `bcryptjs` password hashing. `src/lib/session.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts` (Prisma singleton).
- **Route protection:** `src/proxy.ts` — Next 16's replacement for `middleware.ts` (see deviations below). Redirects any unauthenticated request to `/login`, matcher excludes `/login` and static assets. The `(dashboard)` layout does its own authoritative session + user check too, per Next's own guidance that the proxy layer alone isn't a full security boundary.
- **Login:** `src/app/(auth)/login/page.tsx` + `actions.ts` (Server Action) + `src/components/LoginForm.tsx` (client component using `useActionState` for inline error display). Already-authenticated visitors to `/login` are redirected to `/dashboard`.
- **Dashboard shell:** `src/app/(dashboard)/layout.tsx`, `src/components/Sidebar.tsx` (nav + active-state highlighting + mobile off-canvas + logout), `src/app/(dashboard)/actions.ts` (logout Server Action), and 6 stub pages (`dashboard`, `contacts`, `deals`, `tasks`, `bookings`, `leads`).
- **Theme:** `src/app/globals.css` — Tailwind v4 `@theme` tokens for a single fixed dark theme (`--color-background: #0a0a0a`, `--color-surface`, `--color-border`, `--color-foreground: #fafaf9`, `--color-muted`, `--color-accent: #d4af37` gold, `--color-accent-foreground`). Inter font via `next/font/google`. No light/dark toggle — this app has one permanent brand theme.
- **Seed:** `prisma/seed.ts` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env` and upserts the admin `User`. Seeded with `aron.c.prevost@icloud.com` / `Aron Prevost`.
- **Env:** `.env.example` (committed template) and `.env` (gitignored, real local values — `DATABASE_URL`, `SESSION_SECRET`, admin credentials).

## Decisions made during implementation that weren't pre-specified in the PRD

- **Prisma 7's `PrismaClient` now requires an explicit driver adapter — this wasn't knowable from the PRD or general Prisma familiarity, only from hitting it live.** Even with the classic `prisma-client-js` generator, `new PrismaClient()` with no arguments now throws `PrismaClientInitializationError` at runtime ("A driver adapter is required to connect to your database"). Fixed by installing `@prisma/adapter-pg` + `pg`, and constructing the client as `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })` in both `src/lib/prisma.ts` and `prisma/seed.ts`. Any future milestone's code that imports `PrismaClient` directly (it shouldn't need to — always import the singleton from `src/lib/prisma.ts`) must follow the same pattern.
- **The `url` field is no longer valid inside `datasource db { ... }` in `schema.prisma`** under Prisma 7 — it now lives exclusively in `prisma.config.ts`'s `datasource.url` (used by Migrate/introspection) while the running app supplies its own connection via the adapter above. `schema.prisma`'s datasource block now only declares `provider = "postgresql"`.
- **`prisma migrate dev` did not auto-run `prisma generate` in this Prisma 7 setup** — after migrating, `node_modules/@prisma/client` didn't yet have a generated client and `prisma db seed` failed with `Cannot find module '.prisma/client/default'`. Running `npx prisma generate` explicitly fixed it. Worth running `prisma generate` explicitly after any future schema change, not just relying on `migrate dev`.
- Admin display name (`ADMIN_NAME`) defaulted to "Aron Prevost", inferred from the seed email — there's no profile-editing UI in this milestone to change it later; that'd need to be added in a future milestone if desired.
- Local dev database: a `app` Postgres role (with `CREATEDB` for Prisma's shadow database) and `precision_coach_crm` database were created directly in this sandbox's existing local PostgreSQL 16 cluster — no Docker was available or needed.
- 4 high-severity `npm audit` findings come from Prisma's own bundled (unused) MySQL driver path (`mysql2`, `deepmerge-ts`) — not reachable since this app only uses the Postgres adapter. The suggested `npm audit fix --force` would downgrade to Prisma 6, reintroducing the exact CLI/client version-mismatch problem this milestone deliberately avoided, so it was left as-is.

## Anything the next milestone will need to know

- Import the Prisma client from `@/lib/prisma` (the pre-wired adapter singleton) — never instantiate `new PrismaClient()` directly elsewhere without passing the same `PrismaPg` adapter.
- The `User` model is the only table so far. Milestone 2 (Contacts) should add its own model(s) to `prisma/schema.prisma`, then run `npx prisma migrate dev --name <name>` followed by `npx prisma generate` (don't assume generate runs automatically).
- Auth/session helpers are in `src/lib/session.ts` (`sessionOptions`, `SessionData` type) and `src/lib/auth.ts` (`hashPassword`/`verifyPassword`) — reuse these rather than re-implementing.
- All authenticated pages live under the `(dashboard)` route group and inherit the sidebar shell automatically; just add new `page.tsx` files under `src/app/(dashboard)/<route>/`. Add new top-level sections to `NAV_ITEMS` in `src/components/Sidebar.tsx` if they need their own nav entry.
- The file is `src/proxy.ts`, not `middleware.ts` — Next.js 16 renamed the convention and silently ignores a file called `middleware.ts`. Don't reintroduce one.
- Local dev database quick-start: `service postgresql start` (if not already running), then the app connects to `postgresql://app:app@127.0.0.1:5432/precision_coach_crm`.

## Deviations from the PRD and why

- None in scope — everything specified for Milestone 1 was built as described. The deviations above are implementation-detail adjustments forced by Prisma 7's actual runtime requirements, not scope changes.
