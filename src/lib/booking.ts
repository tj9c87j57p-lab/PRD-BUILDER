import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { zonedTimeToUtc, getZonedYMD, BUSINESS_TIMEZONE } from "@/lib/timezone";

export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 14;

export interface AvailableSlot {
  startAt: Date;
  endAt: Date;
}

function dateOnlyFromYMD(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Advances a {year, month, day} triple by `days`, using a UTC-anchored Date
// purely as a calendar calculator — this never represents a real instant,
// just lets JS handle month/year rollover correctly.
function addDays(
  ymd: { year: number; month: number; day: number },
  days: number
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(ymd.year, ymd.month, ymd.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

export async function getAvailableSlots(coachId: string): Promise<AvailableSlot[]> {
  const now = new Date();
  // "Today" and each subsequent day must be computed in the business's own
  // timezone (Louisiana/Central), not the server's (Vercel runs in UTC) —
  // otherwise both the day-of-week lookup and the slot times end up wrong.
  const todayInBusinessTz = getZonedYMD(now, BUSINESS_TIMEZONE);
  const windowStart = now;
  const windowEndYmd = addDays(todayInBusinessTz, BOOKING_WINDOW_DAYS);
  const windowEnd = dateOnlyFromYMD(
    windowEndYmd.year,
    windowEndYmd.month,
    windowEndYmd.day
  );

  const [windows, blockedDates, bookings] = await Promise.all([
    prisma.availabilityWindow.findMany({ where: { coachId } }),
    prisma.blockedDate.findMany({ where: { coachId } }),
    prisma.booking.findMany({
      where: {
        coachId,
        cancelledAt: null,
        startAt: { lt: windowEnd },
        endAt: { gt: windowStart },
      },
    }),
  ]);

  const slots: AvailableSlot[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const dayYmd = addDays(todayInBusinessTz, offset);
    const dayKey = dateOnlyFromYMD(dayYmd.year, dayYmd.month, dayYmd.day);
    const dayOfWeek = new Date(Date.UTC(dayYmd.year, dayYmd.month, dayYmd.day)).getUTCDay();

    const isBlocked = blockedDates.some((b) => {
      const start = dateOnlyFromYMD(
        b.startDate.getUTCFullYear(),
        b.startDate.getUTCMonth(),
        b.startDate.getUTCDate()
      );
      const end = dateOnlyFromYMD(
        b.endDate.getUTCFullYear(),
        b.endDate.getUTCMonth(),
        b.endDate.getUTCDate()
      );
      return dayKey.getTime() >= start.getTime() && dayKey.getTime() <= end.getTime();
    });
    if (isBlocked) continue;

    const dayWindows = windows.filter((w) => w.dayOfWeek === dayOfWeek);
    for (const window of dayWindows) {
      const startMinutes = parseTimeToMinutes(window.startTime);
      const endMinutes = parseTimeToMinutes(window.endTime);

      for (let m = startMinutes; m + SLOT_MINUTES <= endMinutes; m += SLOT_MINUTES) {
        const slotStart = zonedTimeToUtc(
          dayYmd.year,
          dayYmd.month,
          dayYmd.day,
          Math.floor(m / 60),
          m % 60,
          BUSINESS_TIMEZONE
        );
        const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);

        if (slotStart <= now) continue;

        const overlapsBooking = bookings.some(
          (b) => slotStart < b.endAt && slotEnd > b.startAt
        );
        if (overlapsBooking) continue;

        slots.push({ startAt: slotStart, endAt: slotEnd });
      }
    }
  }

  return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export async function hasOverlappingBooking(
  client: Prisma.TransactionClient,
  coachId: string,
  startAt: Date,
  endAt: Date
): Promise<boolean> {
  const conflict = await client.booking.findFirst({
    where: { coachId, cancelledAt: null, startAt: { lt: endAt }, endAt: { gt: startAt } },
  });
  return Boolean(conflict);
}
