import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LeadMagnetCard } from "@/components/LeadMagnetCard";
import { TestimonialCard } from "@/components/TestimonialCard";

const PAID_OFFERS = [
  { title: "Online Coaching", url: process.env.PAID_OFFER_ONLINE_COACHING_URL },
  {
    title: "Nutrition Coaching",
    url: process.env.PAID_OFFER_NUTRITION_COACHING_URL,
  },
].filter((offer): offer is { title: string; url: string } => Boolean(offer.url));

export default async function HomePage() {
  const leadMagnets = await prisma.leadMagnet.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  const testimonials = await prisma.testimonial.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-10">
      <header className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Precision Coach"
          className="mx-auto h-20 w-auto"
        />
        <p className="mt-2 text-sm text-muted">
          Online &amp; in-person health and fitness coaching.
        </p>
      </header>

      {leadMagnets.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Free guides
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {leadMagnets.map((lm) => (
              <LeadMagnetCard key={lm.id} leadMagnet={lm} />
            ))}
          </div>
        </section>
      ) : null}

      {PAID_OFFERS.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Work with me
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {PAID_OFFERS.map((offer) => (
              <a
                key={offer.title}
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-accent bg-surface p-4 text-center font-medium text-accent transition-opacity hover:opacity-90"
              >
                {offer.title}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Client transformations
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <Link
          href="/book"
          className="block rounded-lg border border-border bg-surface p-4 text-center font-medium text-foreground transition-colors hover:border-accent"
        >
          Book a free consultation call
        </Link>
      </section>

      <footer className="mt-16 text-center">
        <Link
          href="/login"
          className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Admin
        </Link>
      </footer>
    </main>
  );
}
