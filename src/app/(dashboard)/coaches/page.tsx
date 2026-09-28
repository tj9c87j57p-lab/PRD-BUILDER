import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleCoachButton } from "@/components/ToggleCoachButton";

export default async function CoachesPage() {
  const coaches = await prisma.coach.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Coaches
        </h1>
        <Link
          href="/coaches/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Add Coach
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {coaches.length === 0 ? (
          <p className="text-sm text-muted">No coaches yet.</p>
        ) : (
          coaches.map((coach) => (
            <div
              key={coach.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{coach.name}</p>
                <p className="mt-1 text-xs text-muted">{coach.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {coach.active ? "Active — bookable on the public site" : "Inactive"}
                  {" · "}
                  {coach.googleRefreshToken
                    ? "Calendar connected"
                    : "Calendar not connected (falls back to legacy env var if set)"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/coaches/${coach.id}/edit`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Edit
                </Link>
                <ToggleCoachButton id={coach.id} active={coach.active} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
