"use server";

import { prisma } from "@/lib/prisma";
import { SLOT_MINUTES, hasOverlappingBooking } from "@/lib/booking";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { sendEmail } from "@/lib/email";

export interface CreateBookingState {
  error?: string;
  success?: boolean;
}

export async function createBooking(
  _prevState: CreateBookingState | undefined,
  formData: FormData
): Promise<CreateBookingState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const slotRaw = String(formData.get("slot") ?? "").trim();

  if (!name) {
    return { error: "Enter your name." };
  }
  if (!email) {
    return { error: "Enter your email." };
  }
  if (!slotRaw) {
    return { error: "Choose a time." };
  }

  const startAt = new Date(slotRaw);
  if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
    return { error: "That time is no longer available. Please choose another." };
  }
  const endAt = new Date(startAt.getTime() + SLOT_MINUTES * 60 * 1000);

  const existing = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  let contactId: string;
  if (existing) {
    contactId = existing.id;
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        lastContactAt: new Date(),
        phone: existing.phone ?? (phone || null),
      },
    });
  } else {
    const created = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: "Booking",
        lastContactAt: new Date(),
      },
    });
    contactId = created.id;
  }

  let dealId: string | null = null;
  const existingDeal = await prisma.deal.findFirst({ where: { contactId } });
  if (existingDeal) {
    dealId = existingDeal.id;
  } else {
    const callBookedStage = await prisma.stage.findFirst({
      where: { name: "Call Booked" },
    });
    if (callBookedStage) {
      const deal = await prisma.deal.create({
        data: { contactId, stageId: callBookedStage.id, valueCents: 0 },
      });
      dealId = deal.id;
    } else {
      console.warn(
        '[booking] "Call Booked" stage not found — skipping deal creation'
      );
    }
  }

  let bookingId: string;
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await hasOverlappingBooking(tx, startAt, endAt);
      if (conflict) {
        throw new Error("SLOT_TAKEN");
      }
      return tx.booking.create({ data: { contactId, dealId, startAt, endAt } });
    });
    bookingId = booking.id;
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return {
        error: "That time was just booked by someone else. Please choose another.",
      };
    }
    throw error;
  }

  try {
    const eventId = await createCalendarEvent({
      summary: `Call with ${name}`,
      description: `Booked via the website. Contact: ${email}${phone ? `, ${phone}` : ""}`,
      startAt,
      endAt,
      attendeeEmail: email,
    });
    if (eventId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { googleCalendarEventId: eventId },
      });
    }
  } catch (error) {
    console.error("[booking] Google Calendar push failed:", error);
  }

  try {
    await sendEmail({
      to: email,
      subject: "Your call is booked",
      html: `<p>Hi ${name},</p><p>Your call is confirmed for ${startAt.toLocaleString()}.</p>`,
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { confirmationSentAt: new Date() },
    });
  } catch (error) {
    console.error("[booking] confirmation email failed:", error);
  }

  return { success: true };
}
