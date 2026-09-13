import Link from "next/link";
import type { Contact, Deal, Task } from "@prisma/client";
import { CompleteTaskButtons } from "@/components/CompleteTaskButtons";
import { DeleteTaskButton } from "@/components/DeleteTaskButton";

type TaskWithRelations = Task & {
  contact: Contact | null;
  deal: (Deal & { contact: Contact }) | null;
};

function formatDueAt(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TaskList({
  tasks,
  showEntityLinks = false,
}: {
  tasks: TaskWithRelations[];
  showEntityLinks?: boolean;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted">No open tasks.</p>;
  }

  const now = Date.now();

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => {
        const overdue = task.dueAt.getTime() < now;
        return (
          <li
            key={task.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-foreground">{task.description}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{formatDueAt(task.dueAt)}</span>
                  {overdue ? (
                    <span className="rounded-full border border-red-900/60 bg-red-950/30 px-2 py-0.5 text-red-200">
                      Overdue
                    </span>
                  ) : null}
                  {showEntityLinks && task.contact ? (
                    <Link
                      href={`/contacts/${task.contact.id}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {task.contact.name}
                    </Link>
                  ) : null}
                  {showEntityLinks && task.deal ? (
                    <Link
                      href={`/deals/${task.deal.id}`}
                      className="hover:text-foreground hover:underline"
                    >
                      Deal — {task.deal.contact.name}
                    </Link>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <CompleteTaskButtons
                  taskId={task.id}
                  contactId={task.contactId}
                  dealId={task.dealId}
                />
                <div className="flex gap-3">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Edit
                  </Link>
                  <DeleteTaskButton
                    taskId={task.id}
                    taskLabel={task.description}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
