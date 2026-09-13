## What's new in the app

- You can add a follow-up task — a description plus a due date and time — from any contact, any deal, or standalone from the new "My Tasks" page.
- "My Tasks" at `/tasks` lists every open task across the whole app, soonest due date first, with overdue tasks clearly flagged.
- A contact's or deal's own page now shows a "Tasks" section with just its open follow-ups and a quick "+ Add Task" link.
- Mark a task "Complete" with one click, or "Complete & Follow Up" to immediately set up the next one for the same contact/deal.
- Tasks are fully editable and deletable — fix a typo, reschedule, or even un-complete a task you marked done by mistake.
- Deleting a contact or deal that still has an open task no longer breaks anything — the task just becomes unlinked and keeps showing up in My Tasks.

## What was built

- **Schema:** `Task` model (`contactId`, `dealId` — both optional — `description`, `dueAt`, `completedAt`) added to `prisma/schema.prisma`, with `tasks Task[]` back-relations on `Contact` and `Deal`. Both FKs use `onDelete: SetNull` (explicit, not relied on as a default) — deleting a Contact or Deal orphans its open tasks rather than deleting them or blocking the parent delete, the mirror image of `Deal`'s `onDelete: Restrict` from Milestone 3. A compound `@@index([completedAt, dueAt])` matches the global list's exact query shape. Migration `prisma/migrations/20260913220425_add_tasks`.
- **Datetime handling:** new `src/lib/dates.ts` (`toDateTimeInputValue`/`parseDateTimeInput`) for the `datetime-local` input — built with local-time getters (`getHours`/`getMinutes`, never `.toISOString()`) on both the format and parse side, deliberately not reusing the existing date-only helper's approach (see decisions below).
- **Server Actions** (`src/app/(dashboard)/tasks/actions.ts`): `createTask`/`updateTask` (form-bound, `useActionState` shape, mirror `createContact`/`createDeal`), `deleteTask` (mirrors `deleteContact`/`deleteDeal`), `completeTask` (direct-call, Milestone 3's pattern — selects back the task's own `contactId`/`dealId` from the update itself rather than trusting caller-supplied ids, then calls `revalidatePath` on `/tasks` and conditionally the linked contact/deal page).
- **Components:** `TaskForm.tsx` (reusable create/edit, contact/deal optional selects, a "Mark as completed" checkbox that only appears in edit mode), `DeleteTaskButton.tsx`, `CompleteTaskButtons.tsx` (the "Complete" / "Complete & Follow Up" pair — the latter completes then client-navigates to `/tasks/new` pre-filled with the same contact/deal), `TaskList.tsx` (shared rendering for the global list and the embedded per-entity sections, via a `showEntityLinks` flag).
- **Routes:** `/tasks` (replaced the stub), `/tasks/new` (reads `?contactId=`/`?dealId=` from `searchParams` to pre-select), `/tasks/[id]/edit`. No separate read-only `/tasks/[id]` detail page — a task's few fields fit fine directly in list rows and the edit form.
- **Contact and Deal detail pages** (`contacts/[id]/page.tsx`, `deals/[id]/page.tsx`) each gained a "Tasks" section showing that entity's own open tasks plus a pre-filled "+ Add Task" link.

## Decisions made during implementation that weren't pre-specified in the PRD

- **Full CRUD for tasks** (edit, delete, and un-completing via the edit form's checkbox) — a locked-in choice you made, matching the same question asked for Contacts and Deals in earlier milestones.
- **A real datetime bug avoided, not inherited.** The existing date-only helper (`ContactForm`/`DealForm`'s `toDateInputValue`) only round-trips correctly by an accident of the ISO spec (date-only strings parse as UTC). That accident doesn't extend to `datetime-local` strings, which parse as local time. Copying the existing pattern verbatim for the new due-date-and-time field would have silently shifted every displayed time by the server's UTC offset. Fixed with a dedicated helper using matching local-time getters on both ends; verified via a full server round-trip test (created a task due at 11:47pm, reloaded the page, confirmed it still read 11:47pm).
- **`onDelete: SetNull` on both `Task` relations**, decided proactively from Milestone 3's `deleteContact` lesson rather than discovered as a live bug this time — `Task.contactId`/`dealId` are the first *optional* relations in this schema, and Prisma's real default for an optional relation is `SetNull` anyway, but it's stated explicitly per the "be explicit, don't rely on defaults" precedent.
- **No separate read-only Task detail page** — unlike Contact/Deal, a task's handful of fields fit fine in a list row and the edit form; skipping the extra page avoids an unnecessary click for something this small.
- **"Complete & Follow Up" navigates to a pre-filled `/tasks/new`** rather than an inline modal or reveal-in-place form — this app has no modal convention (established in Milestone 2), and reusing the same query-param pre-fill mechanism built for the entity-page "+ Add Task" links kept the implementation consistent rather than introducing a new interaction pattern.
- **No separate "completed tasks" history view** — completing a task just drops it from the visible lists; the only way back is toggling the checkbox off via edit. Matches the PRD's "every open task" framing for this milestone and avoids scope creep; a real completed-tasks log, if ever wanted, is better suited to a later milestone.

## Anything the next milestone will need to know

- The `TaskList` component and its `showEntityLinks` flag are reusable if a later milestone needs another task-list view (e.g., a dashboard widget in Milestone 7 showing "tasks due today").
- `src/lib/dates.ts` is the place to extend for any other date-and-time (not just date-only) field in future milestones — don't reach for `.toISOString()` on anything meant to round-trip through a `datetime-local` input.
- The direct-call Server Action + `revalidatePath` pattern (from Milestone 3, reused here for `completeTask`) is now used in two places; if a future milestone adds another one-click, non-form action, remember it needs its own `revalidatePath` call(s) for every page that could be showing the affected data.
- No per-user timezone handling exists anywhere in this app — due times are stored/compared in the server process's timezone. This is an existing single-tenant assumption, not new to this milestone, but worth knowing if the app is ever deployed somewhere with a different TZ than the coach's actual location.

## Deviations from the PRD and why

- None beyond what was already locked in with you before implementation (full CRUD scope). The "Global Dashboard" half of this milestone's title refers to the global task list itself, not a home-page dashboard summary — that's Milestone 7's "Dashboard Summary" and wasn't touched here.
