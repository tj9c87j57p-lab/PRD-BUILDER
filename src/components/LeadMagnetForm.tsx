"use client";

import { useActionState } from "react";
import type { LeadMagnet } from "@prisma/client";
import {
  createLeadMagnet,
  updateLeadMagnet,
  type LeadMagnetFormState,
} from "@/app/(dashboard)/leads/actions";

const initialState: LeadMagnetFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function LeadMagnetForm({
  leadMagnet,
}: {
  leadMagnet?: LeadMagnet;
}) {
  const action = leadMagnet ? updateLeadMagnet : createLeadMagnet;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {leadMagnet ? (
        <input type="hidden" name="id" value={leadMagnet.id} />
      ) : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {leadMagnet ? "Edit Lead Magnet" : "Add Lead Magnet"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="title" className={labelClasses}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={leadMagnet?.title ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="description" className={labelClasses}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            defaultValue={leadMagnet?.description ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="pdfFile" className={labelClasses}>
            PDF file{leadMagnet ? " (leave blank to keep current)" : ""}
          </label>
          <input
            id="pdfFile"
            name="pdfFile"
            type="file"
            accept="application/pdf"
            required={!leadMagnet}
            className={fieldClasses}
          />
          {leadMagnet ? (
            <p className="mt-1 text-xs text-muted">
              Current file: {leadMagnet.fileUrl}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="coverImageFile" className={labelClasses}>
            Cover image (optional)
          </label>
          <input
            id="coverImageFile"
            name="coverImageFile"
            type="file"
            accept="image/*"
            className={fieldClasses}
          />
          {leadMagnet?.coverImageUrl ? (
            <p className="mt-1 text-xs text-muted">
              Current image: {leadMagnet.coverImageUrl}
            </p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={leadMagnet ? leadMagnet.active : true}
            className="h-4 w-4 rounded border-border bg-background accent-accent"
          />
          Active (listed on the public page)
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
        {pending ? "Saving…" : leadMagnet ? "Save changes" : "Add lead magnet"}
      </button>
    </form>
  );
}
