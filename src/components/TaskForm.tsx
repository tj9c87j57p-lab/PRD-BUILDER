"use client";

import { useActionState } from "react";
import type { Task } from "@prisma/client";
import {
  createTask,
  updateTask,
  type TaskFormState,
} from "@/app/(dashboard)/tasks/actions";
import { toDateTimeInputValue } from "@/lib/dates";
import { formatCents } from "@/lib/money";

const initialState: TaskFormState = {};

const fieldClasses =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";
const labelClasses =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export function TaskForm({
  task,
  contacts,
  deals,
  defaultContactId,
  defaultDealId,
}: {
  task?: Task;
  contacts: { id: string; name: string }[];
  deals: { id: string; valueCents: number; contact: { name: string } }[];
  defaultContactId?: string;
  defaultDealId?: string;
}) {
  const action = task ? updateTask : createTask;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-xl rounded-lg border border-border bg-surface p-8"
    >
      {task ? <input type="hidden" name="id" value={task.id} /> : null}

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {task ? "Edit Task" : "Add Task"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="description" className={labelClasses}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            defaultValue={task?.description ?? ""}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="dueAt" className={labelClasses}>
            Due date &amp; time
          </label>
          <input
            id="dueAt"
            name="dueAt"
            type="datetime-local"
            required
            defaultValue={toDateTimeInputValue(task?.dueAt)}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="contactId" className={labelClasses}>
            Contact
          </label>
          <select
            id="contactId"
            name="contactId"
            defaultValue={task?.contactId ?? defaultContactId ?? ""}
            className={fieldClasses}
          >
            <option value="">None</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dealId" className={labelClasses}>
            Deal
          </label>
          <select
            id="dealId"
            name="dealId"
            defaultValue={task?.dealId ?? defaultDealId ?? ""}
            className={fieldClasses}
          >
            <option value="">None</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.contact.name} ({formatCents(d.valueCents)})
              </option>
            ))}
          </select>
        </div>

        {task ? (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="completed"
              defaultChecked={Boolean(task.completedAt)}
              className="h-4 w-4 rounded border-border bg-background accent-accent"
            />
            Mark as completed
          </label>
        ) : null}
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : task ? "Save changes" : "Add task"}
      </button>
    </form>
  );
}
