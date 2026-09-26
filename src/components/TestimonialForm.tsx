"use client";

import { useActionState } from "react";
import type { Testimonial } from "@prisma/client";
import {
  createTestimonial,
  updateTestimonial,
  type TestimonialFormState,
} from "@/app/(dashboard)/testimonials/actions";

const initialState: TestimonialFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function TestimonialForm({
  testimonial,
}: {
  testimonial?: Testimonial;
}) {
  const action = testimonial ? updateTestimonial : createTestimonial;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {testimonial ? (
        <input type="hidden" name="id" value={testimonial.id} />
      ) : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {testimonial ? "Edit Testimonial" : "Add Testimonial"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="clientName" className={labelClasses}>
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            required
            defaultValue={testimonial?.clientName ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="quote" className={labelClasses}>
            Quote
          </label>
          <textarea
            id="quote"
            name="quote"
            rows={4}
            required
            defaultValue={testimonial?.quote ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="beforePhotoFile" className={labelClasses}>
            Before photo (optional)
          </label>
          <input
            id="beforePhotoFile"
            name="beforePhotoFile"
            type="file"
            accept="image/*"
            className={fieldClasses}
          />
          {testimonial?.beforePhotoUrl ? (
            <p className="mt-1 text-xs text-muted">
              Current photo on file — choose a new one to replace it.
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="afterPhotoFile" className={labelClasses}>
            After photo (optional)
          </label>
          <input
            id="afterPhotoFile"
            name="afterPhotoFile"
            type="file"
            accept="image/*"
            className={fieldClasses}
          />
          {testimonial?.afterPhotoUrl ? (
            <p className="mt-1 text-xs text-muted">
              Current photo on file — choose a new one to replace it.
            </p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="active"
            defaultChecked={testimonial ? testimonial.active : true}
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
        {pending ? "Saving…" : testimonial ? "Save changes" : "Add testimonial"}
      </button>
    </form>
  );
}
