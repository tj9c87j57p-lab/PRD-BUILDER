## What's new in the app

- Deals now live on a real Kanban pipeline at `/deals` — seven stages by default (New Lead → Contacted → Call Booked → Call Completed → Proposal Sent → Won → Lost), each showing its deals, deal count, and stage subtotal.
- You can add a deal (pick a contact, stage, dollar value, expected close date, notes), view/edit/delete it, and drag its card between stages — the move saves instantly.
- Each card shows the contact's name, the deal value, and how many days it's been sitting in its current stage.
- The pipeline stages themselves are fully editable right on the board: click a column title to rename it, drag column headers to reorder them, use "+ Add stage" to create a new one, and delete a stage with the × button (blocked with a clear message if deals are still in it, or if it's the last stage left).
- A running total pipeline value is shown above the board, updating instantly as deals move or are added/removed.
- Deleting a contact that still has deals now shows a friendly "cannot delete" message instead of crashing.

## What was built

- **Schema:** `Stage` (`name`, `position`) and `Deal` (`contactId`, `stageId`, `valueCents`, `expectedCloseDate`, `notes`, `stageEnteredAt`) models added to `prisma/schema.prisma`, plus `deals Deal[]` on `Contact` — the first relation `Contact` has had. Migration `prisma/migrations/20260913213257_add_stages_and_deals`.
- **Seeding:** `prisma/seed.ts` extended with a count-guarded block that seeds the 7 default stages only if none exist yet (not a name-keyed upsert, so a re-run after the coach renames a stage won't resurrect the old name as a duplicate).
- **Money handling:** `src/lib/money.ts` — `dollarsToCents`, `centsToDollarsInput`, `formatCents`, used everywhere a deal value is read or written.
- **Server Actions** (`src/app/(dashboard)/deals/actions.ts`): `createDeal`/`updateDeal`/`deleteDeal` follow the same form-bound pattern as Contacts; `moveDeal`, `renameStage`, `deleteStage`, `createStage`, `reorderStages` are plain async functions called directly from the board's client code (not form-bound), each calling `revalidatePath("/deals")` on success since a directly-invoked Server Action in this Next.js version doesn't refresh the route's data on its own.
- **Deal CRUD UI:** `src/components/DealForm.tsx` (reusable create/edit form, mirrors `ContactForm.tsx`), `src/components/DeleteDealButton.tsx`, and routes `/deals/new`, `/deals/[id]`, `/deals/[id]/edit`.
- **The Kanban board:** `src/components/KanbanBoard.tsx` (owns one `@dnd-kit/core` `DndContext` for two kinds of drags — cards between column bodies, and column headers for reordering — disambiguated via a `type: "card" | "column"` field on each draggable/droppable's `data`, with a custom collision-detection function that only matches same-type drag targets) and `src/components/StageColumnHeader.tsx` (inline rename/delete/drag-handle per column). Optimistic UI via React's `useOptimistic`, so cards move and totals update instantly on drop, with automatic rollback if the server call fails.
- **`deleteContact` fix:** now catches the FK-restrict error (Prisma code `P2003`) that a contact-with-deals delete attempt throws, and redirects back to the contact's page with `?deleteError=1` instead of crashing; the detail page (`src/app/(dashboard)/contacts/[id]/page.tsx`) reads that param and shows a banner naming how many deals are still linked.

## Decisions made during implementation that weren't pre-specified in the PRD

- **Stage management is inline on the board** (drag headers to reorder, click-to-rename, delete/add right there) rather than a separate settings page — this was an explicit choice you made when I flagged it as a real design decision with two reasonable options.
- **Only `@dnd-kit/core` + `@dnd-kit/utilities`, not `@dnd-kit/sortable`.** This milestone only needs "move an item between containers," which `core`'s `useDraggable`/`useDroppable` handle natively; `sortable` is for ordering *within* a list and would have been an extra dependency for no feature gain. Both packages are functionally fine with React 19 today, though the legacy `core`/`sortable` line itself is frozen (no releases in ~2 years — active dnd-kit development has moved to the pre-1.0 `@dnd-kit/react`). Worth revisiting if a real React-19-specific bug ever surfaces; not a concern today.
- **A real, version-specific gotcha:** a Server Action invoked directly from client code (as the drag handlers, rename, and stage CRUD all are, since nothing binds them to a `<form>`) does **not** refresh the calling route's server-rendered data on its own in this Next.js version — it must call `revalidatePath` itself. Missing this would have made drags "work" cosmetically (optimistic UI shows the move) while silently persisting stale data until a hard reload. Every direct-call action in `deals/actions.ts` calls `revalidatePath("/deals")`.
- **A dnd-kit + Next.js SSR gotcha, fixed during verification:** `DndContext` needs an explicit `id` prop (`id="deals-kanban-board"`); without it, dnd-kit's auto-generated accessibility `aria-describedby` id is a module-level incrementing counter that differs between the server-rendered HTML and the client's hydration pass, producing a real (if cosmetic) hydration-mismatch console error on every page load.
- **"Total pipeline value" sums every stage, Won and Lost included** — a locked-in choice from our earlier discussion, taking the literal reading of the PRD over the "open deals only" alternative.
- Deal value is entered as a plain text input (not `type="number"`), matching `ContactForm`'s existing avoidance of native number inputs; `dollarsToCents` handles `$`/`,` stripping and validation.
- `deleteStage` also blocks deleting the very last remaining stage (not explicitly asked for) — without it, a coach could delete every stage and `/deals/new`'s stage picker would have zero options with no way to create a deal to recover. Verified via automated test (deleted 5 of 6 stages down to 1, confirmed the 6th was blocked with a clear message).

## Anything the next milestone will need to know

- `Deal` has no relation yet to a future `Booking` — Milestone 6 (booking/calendar) will need to add its own FK and back-relation, following the same pattern used here for `Contact`↔`Deal`.
- The pattern for a board-style/inline-editing UI (direct Server Action calls via `useTransition`, `revalidatePath` after each one) is now established in `KanbanBoard.tsx`/`StageColumnHeader.tsx` if a later milestone needs something similar; the form-bound `useActionState` pattern remains the right choice for anything that's a discrete multi-field form (like `DealForm`/`ContactForm`).
- `src/lib/money.ts` is the place to extend if a later milestone needs currency formatting (e.g., the dashboard's pipeline-value summary in Milestone 7).
- No pagination or virtualization on the board — fine at one-coach scale, same caveat already noted for the Contacts list in Milestone 2's log.

## Deviations from the PRD and why

- None beyond what was already locked in with you before implementation: inline stage management instead of a settings page, and total pipeline value including Won/Lost.
