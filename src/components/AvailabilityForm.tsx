"use client";

import { useActionState } from "react";
import type { AvailabilityWindow } from "@prisma/client";
import {
  setAvailabilityWindows,
  type AvailabilityFormState,
} from "@/app/(dashboard)/bookings/actions";

const initialState: AvailabilityFormState = {};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent disabled:opacity-40";

export function AvailabilityForm({
  windows,
}: {
  windows: AvailabilityWindow[];
}) {
  const [state, formAction, pending] = useActionState(
    setAvailabilityWindows,
    initialState
  );

  const byDay = new Map(windows.map((w) => [w.dayOfWeek, w]));

  return (
    <form
      action={formAction}
      className="w-full rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Weekly availability
      </h2>
      <p className="mt-1 text-xs text-muted">
        Turn on the days you take calls and set your open hours.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {DAY_NAMES.map((name, day) => {
          const existing = byDay.get(day);
          return (
            <DayRow
              key={day}
              day={day}
              name={name}
              defaultEnabled={Boolean(existing)}
              defaultStart={existing?.startTime ?? "09:00"}
              defaultEnd={existing?.endTime ?? "17:00"}
            />
          );
        })}
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save availability"}
      </button>
    </form>
  );
}

function DayRow({
  day,
  name,
  defaultEnabled,
  defaultStart,
  defaultEnd,
}: {
  day: number;
  name: string;
  defaultEnabled: boolean;
  defaultStart: string;
  defaultEnd: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-3 sm:grid-cols-[10rem_1fr_1fr]">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name={`day-${day}-enabled`}
          defaultChecked={defaultEnabled}
          className="h-4 w-4 rounded border-border bg-background accent-accent"
        />
        {name}
      </label>
      <input
        type="time"
        name={`day-${day}-start`}
        defaultValue={defaultStart}
        className={fieldClasses}
      />
      <input
        type="time"
        name={`day-${day}-end`}
        defaultValue={defaultEnd}
        className={fieldClasses}
      />
    </div>
  );
}
