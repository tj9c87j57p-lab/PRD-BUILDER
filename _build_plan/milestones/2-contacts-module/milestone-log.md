## What's new in the app

- The Contacts page is real now: you can add a contact with name, email, phone, Instagram handle, source, tags, notes, and a last-contacted date.
- Every contact has its own detail page showing the full record, with Edit and Delete actions.
- The contacts list is searchable by name/email/phone, and filterable by tag or source — both dropdowns populate automatically from your actual contacts, not a fixed list.
- Editing a contact reuses the same form as creating one, prefilled with its current values.
- Deleting a contact asks for confirmation first.
- The sidebar now correctly keeps "Contacts" highlighted while you're anywhere under it (viewing, adding, or editing a contact), not just on the list page.

## What was built

- **Schema:** `Contact` model added to `prisma/schema.prisma` (`name` required; `email`, `phone`, `instagramHandle`, `source`, `notes`, `lastContactAt` optional; `tags String[] @default([])`; no relation fields yet — later milestones add their own FK to `Contact` plus its back-relation when Deal/Task/etc. are built). Migration `prisma/migrations/20260913210348_add_contact`.
- **Server Actions** (`src/app/(dashboard)/contacts/actions.ts`): `createContact`/`updateContact` (both `useActionState`-shaped, validate `name`, parse the comma-separated tags input and the date input, `redirect()` on success) and `deleteContact` (reads a hidden `id` field, deletes, redirects to `/contacts`).
- **`src/components/ContactForm.tsx`** — one reusable client component for both create and edit (switches action based on whether a `contact` prop is passed), mirroring `LoginForm.tsx`'s `useActionState` + inline-error pattern.
- **`src/components/DeleteContactButton.tsx`** — small client component, `window.confirm()` guard before submitting the delete action.
- **Pages:**
  - `src/app/(dashboard)/contacts/page.tsx` (replaced the stub) — list + `GET` filter form (`q`, `tag`, `source` search params, all optional and combinable), tag/source dropdown options computed from live data (tags deduped in JS from all contacts; sources via `prisma.contact.groupBy`).
  - `src/app/(dashboard)/contacts/new/page.tsx` — renders the create form.
  - `src/app/(dashboard)/contacts/[id]/page.tsx` — detail view, `notFound()` if the id doesn't exist.
  - `src/app/(dashboard)/contacts/[id]/edit/page.tsx` — edit form, `notFound()` if the id doesn't exist.
- **`src/components/Sidebar.tsx`** — active-link check widened from exact match to `pathname === item.href || pathname.startsWith(item.href + "/")`, so sub-routes highlight correctly. Applies to every nav item, not just Contacts, so Deals/Tasks/Bookings/Leads get the same fix for free when their own sub-routes arrive.

## Decisions made during implementation that weren't pre-specified in the PRD

- **Scope correction**: the PRD's "search/filter by tag, source, deal status" assumes the `Deal` model, which doesn't exist until Milestone 3. This milestone filters by tag and source only; deal-status filtering should be added to this same list UI once Deals exist.
- Tags are stored as a native Postgres `String[]` (no separate `Tag` model) — the right call at one-coach scale. Confirmed the generated Prisma 7.10 client's `ContactWhereInput.tags` filter (`StringNullableListFilter`) supports `has`/`hasSome`/`hasEvery`/`isEmpty` as expected, by reading the generated `node_modules/.prisma/client/index.d.ts` directly rather than assuming.
- The tag filter dropdown is populated by fetching all contacts' `tags` arrays and deduping in JS, not a database-level `DISTINCT`/`unnest` — Prisma's query builder can't expand array elements, and raw SQL would be unnecessary complexity for one coach's contact list. Same reasoning applies to the source dropdown, except `source` is a plain scalar column so `groupBy` works directly there.
- Confirmed (again, from this project's actual generated `.next/types/routes.d.ts`, not assumed) that both `params` and `searchParams` are `Promise`-typed in this installed Next.js 16.3.5 — every new page here `await`s them, same as Milestone 1 had to `await cookies()`.
- No unique constraint on `email` — duplicate contacts are possible. Not in scope for this milestone; flag if it becomes a real problem before some later milestone addresses it.
- No pagination on the contacts list. Fine at one-coach scale and not required by the "done when" criterion, but the list query has no `take`/`skip` — worth knowing before Milestone 7 (dashboard/segmentation) works against a larger contact list.

## Anything the next milestone will need to know

- `Contact` has no relations yet. Milestone 3 (Deals) should add `contactId` + a relation field on its own `Deal` model, and add the corresponding back-relation array (e.g. `deals Deal[]`) to `Contact` in the same migration.
- Reuse the established patterns: Server Actions in a route's own `actions.ts` following the `(prevState, formData) => Promise<State>` shape; one reusable form component per entity, mirroring `ContactForm.tsx`; `notFound()` from `next/navigation` for missing records; URL search params for list filtering (no client JS required).
- Remember to run `npx prisma generate` explicitly after any schema change — `migrate dev` does not auto-run it in this project's Prisma 7 setup (see Milestone 1's log).
- The Sidebar's active-state fix (`startsWith`) now applies to all nav items, so new sub-routes under `/deals`, `/tasks`, etc. will highlight correctly with no further Sidebar changes needed.

## Deviations from the PRD and why

- Filtering by "deal status" was deferred out of this milestone (see scope correction above) — the `Deal` model doesn't exist yet. Everything else specified for the Contacts module (full record, CRUD, search/filter by tag and source, detail page) was built as described.
