"use client";

import { useActionState } from "react";
import type { Coach } from "@prisma/client";
import {
  createCoach,
  updateCoach,
  type CoachFormState,
} from "@/app/(dashboard)/coaches/actions";

const initialState: CoachFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function CoachForm({ coach }: { coach?: Coach }) {
  const action = coach ? updateCoach : createCoach;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {coach ? <input type="hidden" name="id" value={coach.id} /> : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {coach ? "Edit Coach" : "Add Coach"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="name" className={labelClasses}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={coach?.name ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={coach?.email ?? ""}
            className={fieldClasses}
          />
          <p className="mt-1 text-xs text-muted">
            Confirmation and reminder emails to their clients will use this as
            the reply-to address.
          </p>
        </div>
        <div>
          <label htmlFor="googleRefreshToken" className={labelClasses}>
            Google Calendar refresh token
            {coach ? " (leave blank to keep current)" : " (optional)"}
          </label>
          <textarea
            id="googleRefreshToken"
            name="googleRefreshToken"
            rows={3}
            defaultValue=""
            placeholder={
              coach?.googleRefreshToken
                ? "•••••••••••••••••••••••••••• (already connected)"
                : "1//0..."
            }
            className={`${fieldClasses} font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-muted">
            Get this from Google&apos;s OAuth Playground
            (developers.google.com/oauthplayground): use your own OAuth
            credentials (this app&apos;s Client ID/Secret), authorize the
            Calendar scope signed into this coach&apos;s Google account, then
            exchange for tokens and paste the refresh token here. Without
            this, bookings for this coach won&apos;t push to a calendar or
            get a Google Meet link.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={coach ? coach.active : true}
            className="h-4 w-4 rounded border-border bg-background accent-accent"
          />
          Active (bookable on the public site)
        </label>
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : coach ? "Save changes" : "Add coach"}
      </button>
    </form>
  );
}
