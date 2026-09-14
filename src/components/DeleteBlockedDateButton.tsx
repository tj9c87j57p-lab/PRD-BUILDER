"use client";

import { useState, useTransition } from "react";
import { deleteBlockedDate } from "@/app/(dashboard)/bookings/actions";

export function DeleteBlockedDateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await deleteBlockedDate(id);
      setError(result?.error ?? null);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="text-sm text-muted hover:text-foreground disabled:opacity-50"
      >
        Remove
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
