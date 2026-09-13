"use client";

import { deleteContact } from "@/app/(dashboard)/contacts/actions";

export function DeleteContactButton({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName: string;
}) {
  return (
    <form
      action={deleteContact}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${contactName}? This cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={contactId} />
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-red-400 hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
