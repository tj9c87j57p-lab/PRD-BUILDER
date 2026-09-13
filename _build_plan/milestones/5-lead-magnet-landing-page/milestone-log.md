## What's new in the app

- The site's root address (precisioncoach.net) is now a real public, on-brand, mobile-first landing page — the actual link-in-bio destination — instead of redirecting to the login screen.
- It lists your active free lead magnets, each unlocked by a quick name + email form — no page reload, the download link just appears in place.
- Submitting the form automatically creates (or updates) a Contact, tagged with the lead magnet's name, and links to a "Work with me" section featuring your Online Coaching and Nutrition Coaching Payment Links.
- There's a "Book a free consultation call" link ready for Milestone 6, and a small, unobtrusive "Admin" link in the footer to get back into the CRM.
- A new "Leads" admin screen lets you add, edit, and activate/deactivate lead magnets, uploading the PDF and a cover image directly.

## What was built

- **Schema:** `LeadMagnet` (`title`, `description`, `fileUrl`, `coverImageUrl`, `active`) and `LeadMagnetSubmission` (links a `LeadMagnet` to a `Contact`, `submittedAt`), both using `onDelete: Cascade` — the **first `Cascade` in this schema** (vs. `Deal`'s `Restrict`, `Task`'s `SetNull`), deliberate: a submission record is a pure join/log row with no independent value once either endpoint is gone. Migration `prisma/migrations/20260913223830_add_lead_magnets`.
- **The app's first public route.** `src/proxy.ts` rewritten from a pure negative-lookahead matcher to an explicit allowlist (`/`, `/login`, `/book`, and anything under `/uploads/`) checked in the function body — everything else stays protected exactly as before.
- **Local file storage** (`src/lib/storage.ts`) — `saveUploadedFile()` writes to `public/uploads/lead-magnets/{pdf,cover}/`, returning a root-relative URL string decoupled from the storage mechanism. `/public/uploads/` added to `.gitignore` — these are runtime-uploaded files, not repo content.
- **`next.config.ts`** — added `experimental.serverActions.bodySizeLimit: "10mb"` (the default is 1 MB in this Next.js version — any real PDF/image upload would have 413'd without this).
- **Admin CRUD** (`src/app/(dashboard)/leads/`): `actions.ts` (`createLeadMagnet`/`updateLeadMagnet`, form-bound; `toggleLeadMagnetActive`, direct-call), `LeadMagnetForm.tsx`, `ToggleLeadMagnetButton.tsx`, and the list/new/edit pages, all mirroring the established Contact/Deal/Task patterns.
- **The public page**: `src/app/page.tsx` (replaced its old `redirect("/dashboard")` entirely), `src/app/actions.ts` (`submitLeadMagnet` — the Contact upsert-by-email logic), `src/components/LeadMagnetCard.tsx` (per-card gate form + inline download reveal via `useActionState`).
- Paid-offer links read from `PAID_OFFER_ONLINE_COACHING_URL` / `PAID_OFFER_NUTRITION_COACHING_URL` env vars — set to your real Payment Links in the local `.env`; an offer card simply doesn't render if its var is unset.

## Decisions made during implementation that weren't pre-specified in the PRD

- **File storage: local disk, not Cloudflare R2** — no R2 account exists yet, a decision made explicitly with you before implementation. `fileUrl`/`coverImageUrl` are stored as plain URLs so swapping to real object storage later only touches `src/lib/storage.ts`. **This will not survive a real deploy** — flagged as a hard pre-deploy blocker below, not a permanent architecture choice.
- **A real bug caught during verification, not assumed away**: `/` does an uncached Prisma query but Next.js has no way to know that makes it dynamic (Prisma isn't `fetch`), so it gets **statically prerendered**. A production build (`next start`) confirmed this (`x-nextjs-cache: HIT` on every request). This meant a newly created or edited lead magnet would silently never appear on the public page until something else happened to revalidate it — `createLeadMagnet` and `updateLeadMagnet` now explicitly call `revalidatePath("/")` before their redirect, in addition to the already-planned `revalidatePath` in `toggleLeadMagnetActive`. Verified directly against a production build, not just dev mode (which doesn't statically prerender and would have masked this).
- **Another real bug caught during verification**: the plan expected the not-yet-built `/book` link to "404 cleanly," but since `/book` isn't in the public allowlist, unauthenticated visitors were actually getting redirected to `/login` instead — a worse experience than a 404 (a public marketing link silently dumping a visitor onto the admin sign-in screen). Fixed by adding `/book` to `proxy.ts`'s public allowlist now, which also means Milestone 6 doesn't need to remember to do it.
- **Contact upsert is case-insensitive by email, and never overwrites an existing `source`** — the first touch's source stays the source of truth; subsequent lead-magnet downloads only add tags and bump `lastContactAt`. Verified explicitly: the same email submitted against two different lead magnets (in different letter case) produced one Contact with both tags and the original source intact, not two contacts.
- **Minimal upload validation added, not originally specified**: the PDF field is checked for `application/pdf` MIME type on both create and edit. Cheap insurance since nothing else validates upload content, and only the single admin user can reach this form.
- **The gate is friction/obscurity, not a security boundary** — `/uploads/**` is necessarily fully public once carved out of the proxy (there's no way to serve `public/` selectively). This matches how lead-magnet gates work in practice; verified the direct file URL is fetchable unauthenticated by design, not by oversight.

## Anything the next milestone will need to know

- **`/book` is already public** in `src/proxy.ts` — Milestone 6 can build the real booking page there without touching the proxy again.
- **Local-disk storage is a hard pre-deploy blocker**, not a nice-to-have fix: it breaks two different ways depending on the eventual deploy target — ephemeral/read-only filesystems (most serverless/container platforms) lose every uploaded file on redeploy or cold start; even a writable filesystem with a `next build` using `output: "standalone"` only snapshots `public/` as it exists at build time, missing anything written at runtime unless a persistent volume is mounted at the exact same path. Must be swapped for real object storage (Cloudflare R2, per the original PRD) before this app goes live for real — this needs the Cloudflare account/bucket/API keys that don't exist yet.
- **Any future page that reads from the database and needs to reflect admin changes must explicitly `revalidatePath`** — Next.js does not treat a Prisma call as a "dynamic" signal the way it treats `fetch`, so a server component page can get silently statically cached with stale data. This bit `/` in this exact milestone; watch for the same shape anywhere else a public or semi-public page is added.
- No rate-limiting or bot-protection on the public submission form — a scripted flood of fake emails would pollute the contact list. Nothing like this exists anywhere else in the app either; out of scope here, flagged for awareness.

## Deviations from the PRD and why

- File storage uses local disk instead of the PRD's proposed Cloudflare R2, and the booking-page link points to `/book` ahead of Milestone 6 building it — both explicitly agreed with you before implementation, not silent simplifications.
