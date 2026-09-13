"use client";

import { useActionState } from "react";
import type { LeadMagnet } from "@prisma/client";
import {
  submitLeadMagnet,
  type SubmitLeadMagnetState,
} from "@/app/actions";

const initialState: SubmitLeadMagnetState = {};

export function LeadMagnetCard({ leadMagnet }: { leadMagnet: LeadMagnet }) {
  const [state, formAction, pending] = useActionState(
    submitLeadMagnet,
    initialState
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {leadMagnet.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={leadMagnet.coverImageUrl}
          alt=""
          className="h-40 w-full object-cover"
        />
      ) : null}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground">
          {leadMagnet.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{leadMagnet.description}</p>

        {state.downloadUrl ? (
          <a
            href={state.downloadUrl}
            download
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Download your guide
          </a>
        ) : (
          <form action={formAction} className="mt-4 flex flex-col gap-2">
            <input type="hidden" name="leadMagnetId" value={leadMagnet.id} />
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            <input
              type="email"
              name="email"
              placeholder="Your email"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            {state.error ? (
              <p className="text-xs text-red-400">{state.error}</p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Unlocking…" : "Get it free"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
