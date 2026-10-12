import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleCoachButton } from "@/components/ToggleCoachButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  "not-configured":
    "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET aren't set on the server.",
  "state-mismatch": "The sign-in link expired or was reused. Try again.",
  access_denied: "Google access was cancelled.",
  "token-exchange-failed":
    "Google didn't return a refresh token. Check the server logs and try again.",
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const { google, reason } = await searchParams;
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

      {google === "connected" ? (
        <p className="mt-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
          Google Calendar connected. New bookings will go to that coach&apos;s
          calendar.
        </p>
      ) : google === "error" ? (
        <p className="mt-4 rounded-md border border-border bg-surface px-4 py-3 text-sm text-red-400">
          Couldn&apos;t connect Google Calendar.{" "}
          {(reason && GOOGLE_ERROR_MESSAGES[reason]) ?? "Please try again."}
        </p>
      ) : null}

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
                {/* Plain <a>: this hits a route handler that redirects off-site to Google. */}
                <a
                  href={`/api/google/connect?coachId=${coach.id}`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  {coach.googleRefreshToken
                    ? "Reconnect Google"
                    : "Connect Google Calendar"}
                </a>
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
