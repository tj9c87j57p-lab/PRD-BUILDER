"use client";

import { useActionState } from "react";
import {
  createBlockedDate,
  type BlockedDateFormState,
} from "@/app/(dashboard)/bookings/actions";

const initialState: BlockedDateFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function BlockedDateForm() {
  const [state, formAction, pending] = useActionState(
    createBlockedDate,
    initialState
  );

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <div>
        <label htmlFor="startDate" className={labelClasses}>
          Start date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor="endDate" className={labelClasses}>
          End date (optional)
        </label>
        <input id="endDate" name="endDate" type="date" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="reason" className={labelClasses}>
          Reason (optional)
        </label>
        <input
          id="reason"
          name="reason"
          type="text"
          placeholder="Vacation"
          className={fieldClasses}
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Adding…" : "Block dates"}
        </button>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-400 sm:col-span-4">{state.error}</p>
      ) : null}
    </form>
  );
}
