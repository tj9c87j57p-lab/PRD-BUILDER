import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Which coaches are active/bookable can change at any time from the admin
// panel, so this must render fresh, not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function BookPage() {
  const coaches = await prisma.coach.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  if (coaches.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-muted">
          Booking isn&apos;t available right now — check back soon.
        </p>
      </main>
    );
  }

  if (coaches.length === 1) {
    redirect(`/book/${coaches[0].id}`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Book a free consultation call
        </h1>
        <p className="mt-2 text-sm text-muted">Choose who you&apos;d like to talk to.</p>
      </header>

      <section className="mt-8 flex flex-col gap-3">
        {coaches.map((coach) => (
          <Link
            key={coach.id}
            href={`/book/${coach.id}`}
            className="block rounded-lg border border-border bg-surface p-4 text-center font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            {coach.name}
          </Link>
        ))}
      </section>
    </main>
  );
}
