import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleCoachButton } from "@/components/ToggleCoachButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled before access was granted.",
  not_configured: "Google isn't configured on this deployment (missing Client ID/Secret).",
  missing_code: "Google didn't return an authorization code. Try connecting again.",
  coach_not_found: "That coach no longer exists.",
  no_refresh_token:
    "Google didn't return a refresh token. Try connecting again — if it keeps happening, revoke this app's access at myaccount.google.com/permissions and reconnect.",
  exchange_failed: "Connecting to Google failed. Check the server logs for details.",
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; googleError?: string }>;
}) {
  const { connected, googleError } = await searchParams;
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

      {connected ? (
        <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          {connected}&apos;s Google Calendar is connected.
        </p>
      ) : null}
      {googleError ? (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {GOOGLE_ERROR_MESSAGES[googleError] ?? "Connecting to Google failed."}
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
                <a
                  href={`/api/google/connect?coachId=${coach.id}`}
                  className="rounded-md border border-accent px-3 py-1.5 text-sm text-accent transition-colors hover:bg-accent/5"
                >
                  {coach.googleRefreshToken ? "Reconnect calendar" : "Connect calendar"}
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
