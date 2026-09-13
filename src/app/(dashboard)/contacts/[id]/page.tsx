import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeleteContactButton } from "@/components/DeleteContactButton";
import { TaskList } from "@/components/TaskList";

const rowClasses = "flex gap-2 py-2";
const labelClasses = "w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-muted";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { id } = await params;
  const { deleteError } = await searchParams;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { _count: { select: { deals: true } } },
  });

  if (!contact) {
    notFound();
  }

  const tasks = await prisma.task.findMany({
    where: { contactId: id, completedAt: null },
    orderBy: { dueAt: "asc" },
    include: { contact: true, deal: { include: { contact: true } } },
  });

  return (
    <div className="max-w-2xl">
      {deleteError ? (
        <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          Cannot delete — {contact._count.deals} deal
          {contact._count.deals === 1 ? "" : "s"} still linked to this
          contact. Delete or reassign those deals first.
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {contact.name}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
          >
            Edit
          </Link>
          <DeleteContactButton
            contactId={contact.id}
            contactName={contact.name}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <div className={rowClasses}>
          <span className={labelClasses}>Email</span>
          <span className="text-foreground">{contact.email || "—"}</span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Phone</span>
          <span className="text-foreground">{contact.phone || "—"}</span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Instagram</span>
          <span className="text-foreground">
            {contact.instagramHandle || "—"}
          </span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Source</span>
          <span className="text-foreground">{contact.source || "—"}</span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Tags</span>
          <span className="flex flex-wrap gap-1.5">
            {contact.tags.length > 0
              ? contact.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                  >
                    {t}
                  </span>
                ))
              : "—"}
          </span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Last contacted</span>
          <span className="text-foreground">
            {formatDate(contact.lastContactAt)}
          </span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Created</span>
          <span className="text-foreground">
            {formatDate(contact.createdAt)}
          </span>
        </div>
        <div className={`${rowClasses} border-t border-border mt-2 pt-4`}>
          <span className={labelClasses}>Notes</span>
          <span className="whitespace-pre-wrap text-foreground">
            {contact.notes || "—"}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Tasks
          </h2>
          <Link
            href={`/tasks/new?contactId=${contact.id}`}
            className="text-sm text-accent hover:opacity-80"
          >
            + Add Task
          </Link>
        </div>
        <div className="mt-3">
          <TaskList tasks={tasks} />
        </div>
      </div>

      <Link
        href="/contacts"
        className="mt-4 inline-block text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Back to contacts
      </Link>
    </div>
  );
}
