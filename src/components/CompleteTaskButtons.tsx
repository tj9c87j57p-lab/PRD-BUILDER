"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeTask } from "@/app/(dashboard)/tasks/actions";

export function CompleteTaskButtons({
  taskId,
  contactId,
  dealId,
}: {
  taskId: string;
  contactId: string | null;
  dealId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function complete(andFollowUp: boolean) {
    startTransition(async () => {
      const result = await completeTask(taskId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      if (andFollowUp) {
        const params = new URLSearchParams();
        if (contactId) params.set("contactId", contactId);
        if (dealId) params.set("dealId", dealId);
        router.push(`/tasks/new${params.toString() ? `?${params}` : ""}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => complete(false)}
          className="text-sm text-accent hover:opacity-80 disabled:opacity-50"
        >
          Complete
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => complete(true)}
          className="text-sm text-muted hover:text-foreground disabled:opacity-50"
        >
          Complete &amp; Follow Up
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
