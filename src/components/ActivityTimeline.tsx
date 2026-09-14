import type { ActivityLogEntry } from "@prisma/client";

const TYPE_LABELS: Record<string, string> = {
  contact_created: "Contact added",
  note_updated: "Notes",
  deal_created: "Deal",
  deal_stage_changed: "Deal",
  task_created: "Task",
  task_completed: "Task",
  lead_magnet_downloaded: "Download",
  booking_created: "Booking",
  booking_cancelled: "Booking",
  email_sent: "Email",
};

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ActivityTimeline({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
              <p className="mt-1.5 text-sm text-foreground">
                {entry.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted">
              {formatTimestamp(entry.createdAt)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
