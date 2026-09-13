"use client";

import { useState, useTransition } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { renameStage, deleteStage } from "@/app/(dashboard)/deals/actions";
import { formatCents } from "@/lib/money";

export function StageColumnHeader({
  stageId,
  name,
  totalCents,
  dealCount,
}: {
  stageId: string;
  name: string;
  totalCents: number;
  dealCount: number;
}) {
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { attributes, listeners, setNodeRef: setDragRef } = useDraggable({
    id: `column:${stageId}`,
    data: { type: "column", stageId },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `column:${stageId}`,
    data: { type: "column", stageId },
  });

  function commitRename() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    startTransition(async () => {
      const result = await renameStage(stageId, trimmed);
      setError(result?.error ?? null);
      if (result?.error) setValue(name);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete the "${name}" stage?`)) return;
    startTransition(async () => {
      const result = await deleteStage(stageId);
      setError(result?.error ?? null);
    });
  }

  return (
    <div
      ref={setDropRef}
      className={`rounded-t-lg border border-b-0 bg-surface p-3 transition-colors ${
        isOver ? "border-accent" : "border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          ref={setDragRef}
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-muted"
          aria-label="Drag to reorder stage"
        >
          ⠿
        </span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              (event.target as HTMLInputElement).blur();
            }
          }}
          disabled={isPending}
          className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-foreground outline-none focus:underline"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-muted hover:text-red-400"
          aria-label={`Delete ${name} stage`}
        >
          ×
        </button>
      </div>
      <div className="mt-1 text-xs text-muted">
        {dealCount} deal{dealCount === 1 ? "" : "s"} · {formatCents(totalCents)}
      </div>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
