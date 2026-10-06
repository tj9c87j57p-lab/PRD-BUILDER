"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity, ACTIVITY_TYPES } from "@/lib/activity";
import { formatInBusinessTimezone } from "@/lib/timezone";
import { createCalendarEvent } from "@/lib/googleCalendar";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface AvailabilityFormState {
  error?: string;
}

export async function setAvailabilityWindows(
  _prevState: AvailabilityFormState | undefined,
  formData: FormData
): Promise<AvailabilityFormState> {
  const coachId = String(formData.get("coachId") ?? "").trim();
  if (!coachId) {
    return { error: "Missing coach id." };
  }

  const windows: { coachId: string; dayOfWeek: number; startTime: string; endTime: string }[] =
    [];

  for (let day = 0; day < 7; day++) {
    const enabled = formData.get(`day-${day}-enabled`) === "on";
    if (!enabled) continue;

    const startTime = String(formData.get(`day-${day}-start`) ?? "").trim();
    const endTime = String(formData.get(`day-${day}-end`) ?? "").trim();

    if (!startTime || !endTime) {
      return { error: `Set both a start and end time for ${DAY_NAMES[day]}.` };
    }
    if (startTime >= endTime) {
      return { error: `${DAY_NAMES[day]}'s start time must be before its end time.` };
    }

    windows.push({ coachId, dayOfWeek: day, startTime, endTime });
  }

  await prisma.$transaction([
    prisma.availabilityWindow.deleteMany({ where: { coachId } }),
    prisma.availabilityWindow.createMany({ data: windows }),
  ]);

  revalidatePath("/bookings");
  revalidatePath("/book");
  return {};
}

export interface BlockedDateFormState {
  error?: string;
}

export async function createBlockedDate(
  _prevState: BlockedDateFormState | undefined,
  formData: FormData
): Promise<BlockedDateFormState> {
  const coachId = String(formData.get("coachId") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!coachId) {
    return { error: "Missing coach id." };
  }
  if (!startDateRaw) {
    return { error: "Choose a start date." };
  }

  const startDate = new Date(startDateRaw);
  const endDate = endDateRaw ? new Date(endDateRaw) : startDate;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Enter valid dates." };
  }
  if (startDate.getTime() > endDate.getTime()) {
    return { error: "End date must be on or after the start date." };
  }

  await prisma.blockedDate.create({ data: { coachId, startDate, endDate, reason } });

  revalidatePath("/bookings");
  revalidatePath("/book");
  return {};
}

export async function deleteBlockedDate(id: string): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing blocked date id." };
  }

  await prisma.blockedDate.delete({ where: { id } });

  revalidatePath("/bookings");
  revalidatePath("/book");
  return {};
}

export async function cancelBooking(id: string): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing booking id." };
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { cancelledAt: new Date() },
    select: { contactId: true, startAt: true },
  });

  await logActivity(
    booking.contactId,
    ACTIVITY_TYPES.BOOKING_CANCELLED,
    `Cancelled call scheduled for ${formatInBusinessTimezone(booking.startAt)}`
  );

  revalidatePath("/bookings");
  revalidatePath("/book");
  revalidatePath(`/contacts/${booking.contactId}`);
  return {};
}

// Backfills a calendar event for a booking that was created while the
// coach's Google refresh token was expired/missing, so it never got
// pushed at booking time. Safe to call on a booking that already has one.
export async function syncBookingToCalendar(id: string): Promise<{ error?: string }> {
  if (!id) {
    return { error: "Missing booking id." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { contact: true, coach: true },
  });
  if (!booking) {
    return { error: "Booking not found." };
  }
  if (booking.cancelledAt) {
    return { error: "This booking was cancelled." };
  }

  try {
    const event = await createCalendarEvent({
      summary: `Call with ${booking.contact.name}`,
      description: `Booked via the website. Contact: ${booking.contact.email}${
        booking.contact.phone ? `, ${booking.contact.phone}` : ""
      }`,
      startAt: booking.startAt,
      endAt: booking.endAt,
      attendeeEmail: booking.contact.email ?? undefined,
      coachRefreshToken: booking.coach.googleRefreshToken,
    });
    if (!event?.eventId) {
      return { error: "Calendar isn't connected for this coach yet." };
    }
    await prisma.booking.update({
      where: { id },
      data: { googleCalendarEventId: event.eventId, googleMeetLink: event.meetLink },
    });
  } catch (error) {
    console.error("[bookings] manual calendar sync failed:", error);
    return { error: "Google Calendar push failed. Check the server logs." };
  }

  revalidatePath("/bookings");
  return {};
}
