## What's new in the app

- Every contact now has a full activity history: opening a contact shows every touchpoint — when they were added, notes updated, deals created or moved between stages, tasks created or completed, lead magnets downloaded, calls booked or cancelled, and emails sent — newest first.
- The Dashboard is now live: total pipeline value, tasks due today, overdue tasks (with the actual list right below), and how many new leads came in over the last 7 days, all at a glance the moment you log in.
- The Contacts list can now filter by booking status — find contacts who've "Never booked" or who "Has booked a call" — combine it with the existing tag/source filters to spot cold leads, e.g. everyone who downloaded a specific free guide but never booked a call.
- You can send a one-off email straight from a contact's own page — subject and message, no need to leave the CRM — and it's automatically logged to their activity history.

## What was built

- **Schema:** `ActivityLogEntry` (`contactId`, `type`, `description`, `createdAt`) added, with `onDelete: Cascade` (same reasoning as `LeadMagnetSubmission` — a pure log row with no independent value once its Contact is gone) and a back-relation `activityLog ActivityLogEntry[]` on `Contact`. `type` is a plain `String`, matching this schema's existing convention of free-form categorical strings rather than a Prisma enum. Migration `prisma/migrations/20260914004134_add_activity_log`.
- **`src/lib/activity.ts`** — `ACTIVITY_TYPES` constant object (10 types) and `logActivity(contactId, type, description)`, the single write path for every timeline entry.
- **Instrumentation** — a `logActivity(...)` call added at every existing state-changing touchpoint across the app, with no other behavior change to those flows:
  - `contacts/actions.ts`: `createContact` (contact added), `updateContact` (notes updated, only when notes actually changed).
  - `deals/actions.ts`: `createDeal` (deal created, with the stage name), `updateDeal` and `moveDeal` (stage changed, only when the stage actually changed — both already computed this condition for `stageEnteredAt`).
  - `tasks/actions.ts`: `createTask`, `updateTask` (only on the false→true completion transition), `completeTask` — all resolving the target contact via `contactId ?? deal.contactId` when a task is linked only through a Deal.
  - `app/actions.ts` (`submitLeadMagnet`): lead magnet downloaded, plus contact added on the new-contact branch.
  - `app/book/actions.ts` (`createBooking`): call booked, plus contact added on the new-contact branch.
  - `bookings/actions.ts` (`cancelBooking`): call cancelled.
- **`src/lib/email.ts`** — extended `sendEmail`'s input with an optional `replyTo`, passed through to Resend.
- **One-off email** — `sendContactEmail` (new, in `contacts/actions.ts`): validates subject/body, blocks with a clear error if the contact has no email on file, converts the plain-text body to simple HTML, sends via `sendEmail` with `replyTo` set to `ADMIN_EMAIL`, and logs the send. `src/components/SendEmailForm.tsx` (new) renders the compose form on the Contact detail page.
- **Timeline UI** — `src/components/ActivityTimeline.tsx` (new), rendering a Contact's `ActivityLogEntry` rows newest-first with a type badge, description, and timestamp. Wired into `contacts/[id]/page.tsx` alongside the new email form, both below the existing Tasks section.
- **Segmentation** — `contacts/page.tsx` gained a `booked` filter (`?booked=yes|no`) using the `bookings` relation from Milestone 6 (`{ none: {} }` / `{ some: {} }`), alongside the existing search/tag/source filters built in Milestone 2.
- **Dashboard** (`dashboard/page.tsx`, replacing the Milestone 4 stub) — four stat cards (pipeline value excluding Won/Lost deals, tasks due today, overdue tasks, new leads in the last 7 days) plus the actual due-today/overdue task list underneath, reusing the existing `TaskList` component. `export const dynamic = "force-dynamic"` set from the start.

## Decisions made during implementation that weren't pre-specified in the PRD

- **Pipeline value excludes Won and Lost deals** — a locked-in choice made with you before implementation: a Won deal is already-closed revenue, not pipeline still in motion, and a Lost deal has no forward value.
- **"New leads this week" uses a rolling 7-day window**, not a Monday–Sunday calendar week — the PRD doesn't specify a convention, and rolling avoids an arbitrary week-start choice.
- **`ActivityTimeline` order is newest-first** — matches this app's other reverse-chronological lists (e.g. the Contacts list itself) and puts what just happened at the top, where it's most useful.
- **The booking-status filter extends the existing `/contacts` page** rather than a new "Segments" page or nav item — `/contacts` already had the search/tag/source filters from Milestone 2, and adding one more `<select>` reproduces the PRD's own example ("downloaded eGuide but never booked") without duplicating a list view that already exists.
- **A one-off email's plain-text body is converted to simple paragraph HTML** (escaped, one `<p>` per line) rather than adding a rich-text editor — this is a single quick message, not a marketing campaign, and the PRD explicitly excludes bulk/marketing email from this milestone.
- **A real test-script bug caught and fixed during verification, not an app bug**: an unscoped `button[type="submit"]` selector in the verification script matched the Sidebar's "Log out" button before the actual form's submit button (same DOM-order ambiguity flagged in the Milestone 2 log), silently logging the admin out mid-test instead of submitting the form. Fixed by scoping every form-submit click to `main button[type="submit"]`, confirmed by re-running the full walkthrough afterward.

## Anything the next milestone will need to know

- This is the final milestone in the original 7-milestone build order. `_build_plan/` is now fully non-functional scaffolding per its original purpose and can be deleted once you're satisfied everything above is working as expected.
- The pre-deploy blockers flagged in earlier milestones still stand and are unchanged by this one: local file storage needs to move to Cloudflare R2 (Milestone 5), and Google Calendar OAuth credentials / a Resend API key / external cron configuration for `/api/reminders` are all still needed for those integrations to do more than log-and-skip (Milestone 6). The one-off email feature built here reuses the same Resend module and has the identical no-op-until-configured behavior.
- `src/lib/activity.ts`'s `logActivity` and `ACTIVITY_TYPES` are the place to extend if any future change adds a new kind of contact touchpoint — keep using the shared helper rather than inserting raw `prisma.activityLogEntry.create` calls, so every entry stays consistent.

## Deviations from the PRD and why

- None beyond what was already confirmed with you before implementation (pipeline value definition). The booking-status filter living on the existing `/contacts` page instead of a separate view is an implementation-location choice, not a scope change — the PRD's "segmentation view" and this app's "contact list" are the same screen.
