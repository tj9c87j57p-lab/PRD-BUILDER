import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export async function getAvailableSlots(): Promise<AvailableSlot[]> {
  const now = new Date();
  const windowStart = now;
  const windowEnd = dateOnlyFromYMD(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + BOOKING_WINDOW_DAYS
  );

  const [windows, blockedDates, bookings] = await Promise.all([
    prisma.availabilityWindow.findMany(),
    prisma.blockedDate.findMany(),
    prisma.booking.findMany({
      where: { cancelledAt: null, startAt: { lt: windowEnd }, endAt: { gt: windowStart } },
    }),
  ]);

  const slots: AvailableSlot[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const dayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayKey = dateOnlyFromYMD(
      dayLocal.getFullYear(),
      dayLocal.getMonth(),
      dayLocal.getDate()
    );
    const dayOfWeek = dayLocal.getDay();

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
        const slotStart = new Date(
          dayLocal.getFullYear(),
          dayLocal.getMonth(),
          dayLocal.getDate(),
          0,
          m
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
  startAt: Date,
  endAt: Date
): Promise<boolean> {
  const conflict = await client.booking.findFirst({
    where: { cancelledAt: null, startAt: { lt: endAt }, endAt: { gt: startAt } },
  });
  return Boolean(conflict);
}
