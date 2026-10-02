// The business operates in a single physical location (Louisiana), so all
// availability hours, slot generation, and displayed booking times are
// anchored to this zone — regardless of the server's own timezone (Vercel
// runs in UTC) or a given visitor's browser timezone.
export const BUSINESS_TIMEZONE = "America/Chicago";

function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>(
    (acc, part) => {
      acc[part.type] = part.value;
      return acc;
    },
    {}
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60000;
}

/**
 * Builds the real UTC instant for a wall-clock date/time as experienced in
 * `timeZone` (e.g. 2026-10-02 11:00 in America/Chicago, DST-aware).
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = BUSINESS_TIMEZONE
): Date {
  const naiveUtc = Date.UTC(year, month, day, hour, minute);
  const offsetMinutes = getTimezoneOffsetMinutes(new Date(naiveUtc), timeZone);
  return new Date(naiveUtc - offsetMinutes * 60000);
}

/** The calendar date (and day-of-week) a given instant falls on in `timeZone`. */
export function getZonedYMD(
  date: Date,
  timeZone: string = BUSINESS_TIMEZONE
): { year: number; month: number; day: number; dayOfWeek: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>(
    (acc, part) => {
      acc[part.type] = part.value;
      return acc;
    },
    {}
  );
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    dayOfWeek: WEEKDAYS.indexOf(parts.weekday),
  };
}

/**
 * Formats an instant in the business timezone with an explicit zone label.
 * Uses explicit component options rather than dateStyle/timeStyle, since
 * those can't be combined with timeZoneName in this Intl implementation.
 */
export function formatInBusinessTimezone(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    timeZoneName: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
