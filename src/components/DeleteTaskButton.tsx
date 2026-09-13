"use client";

import { deleteTask } from "@/app/(dashboard)/tasks/actions";

export function DeleteTaskButton({
  taskId,
  taskLabel,
}: {
  taskId: string;
  taskLabel: string;
}) {
  return (
    <form
      action={deleteTask}
      onSubmit={(event) => {
        if (!window.confirm(`Delete the task "${taskLabel}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={taskId} />
      <button
        type="submit"
        className="text-sm text-muted transition-colors hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
