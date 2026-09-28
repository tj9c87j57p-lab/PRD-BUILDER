import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AvailabilityForm } from "@/components/AvailabilityForm";
import { BlockedDateForm } from "@/components/BlockedDateForm";
import { DeleteBlockedDateButton } from "@/components/DeleteBlockedDateButton";
import { CancelBookingButton } from "@/components/CancelBookingButton";

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

function formatBookingTime(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string }>;
}) {
  const { coach: coachParam } = await searchParams;

  const coaches = await prisma.coach.findMany({ orderBy: { createdAt: "asc" } });
  const selectedCoach =
    coaches.find((c) => c.id === coachParam) ?? coaches[0] ?? null;

  if (!selectedCoach) {
    notFound();
  }

  const [windows, blockedDates, upcomingBookings] = await Promise.all([
    prisma.availabilityWindow.findMany({
      where: { coachId: selectedCoach.id },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: { coachId: selectedCoach.id },
      orderBy: { startDate: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        coachId: selectedCoach.id,
        cancelledAt: null,
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      include: { contact: true },
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
                c.id === selectedCoach.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}

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
                    {formatBookingTime(booking.startAt)}
                    {booking.contact.email ? ` — ${booking.contact.email}` : ""}
                  </p>
                </div>
                <CancelBookingButton id={booking.id} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
