import { getAvailableSlots } from "@/lib/booking";
import { BookingForm } from "@/components/BookingForm";

// The slot list depends on the current wall-clock time (past slots drop off,
// the 14-day window slides forward) as well as live Booking rows — a
// revalidatePath on writes alone can't keep this correct as time passes, so
// this page must render fresh on every request, not be statically prerendered.
export const dynamic = "force-dynamic";

function formatSlotLabel(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BookPage() {
  const slots = await getAvailableSlots();
  const options = slots.map((slot) => ({
    value: slot.startAt.toISOString(),
    label: formatSlotLabel(slot.startAt),
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Book a free consultation call
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick a time that works for you.
        </p>
      </header>

      <section className="mt-8">
        <BookingForm slots={options} />
      </section>
    </main>
  );
}
