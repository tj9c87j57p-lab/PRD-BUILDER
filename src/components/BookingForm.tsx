"use client";

import { useActionState } from "react";
import { createBooking, type CreateBookingState } from "@/app/book/actions";

const initialState: CreateBookingState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function BookingForm({
  slots,
}: {
  slots: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createBooking,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-lg border border-accent bg-surface p-6 text-center">
        <p className="font-medium text-foreground">You&apos;re booked!</p>
        <p className="mt-2 text-sm text-muted">
          Check your email for a confirmation.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-muted">
        No open times right now — check back soon.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label htmlFor="slot" className={labelClasses}>
          Choose a time
        </label>
        <select id="slot" name="slot" required className={fieldClasses}>
          {slots.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className={fieldClasses}
      />
      <input
        type="email"
        name="email"
        placeholder="Your email"
        required
        className={fieldClasses}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone (optional)"
        className={fieldClasses}
      />
      {state.error ? <p className="text-xs text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Booking…" : "Book call"}
      </button>
    </form>
  );
}
