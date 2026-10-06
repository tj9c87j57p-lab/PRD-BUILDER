"use client";

import { useState, useTransition } from "react";
import { syncBookingToCalendar } from "@/app/(dashboard)/bookings/actions";

export function SyncToCalendarButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await syncBookingToCalendar(id);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setDone(true);
      }
    });
  }

  if (done) {
    return <p className="text-xs text-emerald-400">Added to calendar</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md border border-accent px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/5 disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add to calendar"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
