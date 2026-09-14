import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowStart = new Date();
  const windowEnd = new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      cancelledAt: null,
      reminderSentAt: null,
      startAt: { gte: windowStart, lte: windowEnd },
    },
    include: { contact: true },
  });

  for (const booking of bookings) {
    if (!booking.contact.email) continue;

    await sendEmail({
      to: booking.contact.email,
      subject: "Reminder: your upcoming call",
      html: `<p>Hi ${booking.contact.name},</p><p>Just a reminder — your call is coming up on ${booking.startAt.toLocaleString()}.</p>`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return NextResponse.json({ sent: bookings.length });
}
