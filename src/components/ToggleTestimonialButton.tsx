"use client";

import { useState, useTransition } from "react";
import { toggleTestimonialActive } from "@/app/(dashboard)/testimonials/actions";

export function ToggleTestimonialButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await toggleTestimonialActive(id);
      setError(result?.error ?? null);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
