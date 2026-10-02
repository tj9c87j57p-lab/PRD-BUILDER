"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity, ACTIVITY_TYPES } from "@/lib/activity";
import { formatInBusinessTimezone } from "@/lib/timezone";

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
