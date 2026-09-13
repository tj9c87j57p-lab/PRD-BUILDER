"use client";

import { useActionState } from "react";
import type { Contact } from "@prisma/client";
import {
  createContact,
  updateContact,
  type ContactFormState,
} from "@/app/(dashboard)/contacts/actions";

const initialState: ContactFormState = {};

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function ContactForm({ contact }: { contact?: Contact }) {
  const action = contact ? updateContact : createContact;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {contact ? "Edit Contact" : "Add Contact"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClasses}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={contact?.name ?? ""}
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
            defaultValue={contact?.email ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={contact?.phone ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="instagramHandle" className={labelClasses}>
            Instagram handle
          </label>
          <input
            id="instagramHandle"
            name="instagramHandle"
            type="text"
            placeholder="@handle"
            defaultValue={contact?.instagramHandle ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="source" className={labelClasses}>
            Source
          </label>
          <input
            id="source"
            name="source"
            type="text"
            placeholder="Lead magnet, DM, referral…"
            defaultValue={contact?.source ?? ""}
            className={fieldClasses}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="tags" className={labelClasses}>
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="Comma-separated, e.g. downloaded-ebook, warm-lead"
            defaultValue={contact?.tags.join(", ") ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="lastContactAt" className={labelClasses}>
            Last contacted
          </label>
          <input
            id="lastContactAt"
            name="lastContactAt"
            type="date"
            defaultValue={toDateInputValue(contact?.lastContactAt)}
            className={fieldClasses}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClasses}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={contact?.notes ?? ""}
            className={fieldClasses}
          />
        </div>
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : contact ? "Save changes" : "Add contact"}
      </button>
    </form>
  );
}
