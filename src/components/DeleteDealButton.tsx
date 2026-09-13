"use client";

import { deleteDeal } from "@/app/(dashboard)/deals/actions";

export function DeleteDealButton({
  dealId,
  dealLabel,
}: {
  dealId: string;
  dealLabel: string;
}) {
  return (
    <form
      action={deleteDeal}
      onSubmit={(event) => {
        if (!window.confirm(`Delete the deal with ${dealLabel}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={dealId} />
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-red-400 hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
