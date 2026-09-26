"use client";

import { deleteTestimonial } from "@/app/(dashboard)/testimonials/actions";

export function DeleteTestimonialButton({
  testimonialId,
  clientName,
}: {
  testimonialId: string;
  clientName: string;
}) {
  return (
    <form
      action={deleteTestimonial}
      onSubmit={(event) => {
        if (
          !window.confirm(`Delete the testimonial from ${clientName}? This cannot be undone.`)
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={testimonialId} />
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-red-400 hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
