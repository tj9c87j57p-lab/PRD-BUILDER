"use client";

import { useActionState } from "react";
import {
  sendContactEmail,
  type SendEmailFormState,
} from "@/app/(dashboard)/contacts/actions";

const initialState: SendEmailFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function SendEmailForm({
  contactId,
  hasEmail,
}: {
  contactId: string;
  hasEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    sendContactEmail,
    initialState
  );

  if (!hasEmail) {
    return (
      <p className="text-sm text-muted">
        Add an email address to this contact to send them a message.
      </p>
    );
  }

  if (state.success) {
    return <p className="text-sm text-foreground">Email sent.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="contactId" value={contactId} />
      <div>
        <label htmlFor="subject" className={labelClasses}>
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor="body" className={labelClasses}>
          Message
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          className={fieldClasses}
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
