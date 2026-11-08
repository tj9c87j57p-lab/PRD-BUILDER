import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AvailabilityForm } from "@/components/AvailabilityForm";
import { BlockedDateForm } from "@/components/BlockedDateForm";
import { DeleteBlockedDateButton } from "@/components/DeleteBlockedDateButton";
import { CancelBookingButton } from "@/components/CancelBookingButton";
import { SyncToCalendarButton } from "@/components/SyncToCalendarButton";
import { formatInBusinessTimezone } from "@/lib/timezone";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function formatDateRange(start: Date, end: Date): string {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

// This renders server-side (Vercel runs in UTC), so the actual call time
// must be pinned to the business's own timezone explicitly — the server's
// local time isn't the business's, and there's no per-admin browser here.
function formatBookingTime(date: Date): string {
  return formatInBusinessTimezone(new Date(date));
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string }>;
}) {
  const { coach: coachParam } = await searchParams;
  const isAllView = coachParam === "all";

  const coaches = await prisma.coach.findMany({ orderBy: { createdAt: "asc" } });
  const selectedCoach = isAllView
    ? null
    : coaches.find((c) => c.id === coachParam) ?? coaches[0] ?? null;

  if (!isAllView && !selectedCoach) {
    notFound();
  }

  const [windows, blockedDates, upcomingBookings] = await Promise.all([
    selectedCoach
      ? prisma.availabilityWindow.findMany({
          where: { coachId: selectedCoach.id },
          orderBy: { dayOfWeek: "asc" },
        })
      : Promise.resolve([]),
    selectedCoach
      ? prisma.blockedDate.findMany({
          where: { coachId: selectedCoach.id },
          orderBy: { startDate: "asc" },
        })
      : Promise.resolve([]),
    prisma.booking.findMany({
      where: {
        coachId: selectedCoach?.id,
        cancelledAt: null,
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      include: { contact: true, coach: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bookings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Manage call availability and see who&apos;s booked, per coach.
        </p>
      </div>

      {coaches.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {coaches.map((c) => (
            <Link
              key={c.id}
              href={`/bookings?coach=${c.id}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                !isAllView && c.id === selectedCoach?.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/bookings?coach=all"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isAllView
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            All coaches
          </Link>
        </div>
      ) : null}

      {selectedCoach ? (
        <>
          <AvailabilityForm coachId={selectedCoach.id} windows={windows} />

          <section className="w-full rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Blocked dates
            </h2>
            <p className="mt-1 text-xs text-muted">
              Vacation or one-off days {selectedCoach.name} is unavailable, even
              during their usual hours.
            </p>

            <div className="mt-4">
              <BlockedDateForm coachId={selectedCoach.id} />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {blockedDates.length === 0 ? (
                <p className="text-sm text-muted">No blocked dates.</p>
              ) : (
                blockedDates.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-2"
                  >
                    <div>
                      <p className="text-sm text-foreground">
                        {formatDateRange(b.startDate, b.endDate)}
                      </p>
                      {b.reason ? (
                        <p className="text-xs text-muted">{b.reason}</p>
                      ) : null}
                    </div>
                    <DeleteBlockedDateButton id={b.id} />
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">
          Showing upcoming calls for every coach. Select a coach above to
          manage their availability and blocked dates.
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Upcoming calls
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted">No upcoming calls booked.</p>
          ) : (
            upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {booking.contact.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatBookingTime(booking.startAt)} with {booking.coach.name}
                    {booking.contact.email ? ` — ${booking.contact.email}` : ""}
                  </p>
                  {!booking.googleCalendarEventId ? (
                    <p className="mt-1 text-xs text-amber-500">
                      Not on Google Calendar
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!booking.googleCalendarEventId ? (
                    <SyncToCalendarButton id={booking.id} />
                  ) : null}
                  <CancelBookingButton id={booking.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
