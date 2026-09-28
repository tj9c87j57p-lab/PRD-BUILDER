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
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-12 sm:px-6">
      <header className="relative text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Precision Coach"
          className="relative mx-auto h-24 w-auto drop-shadow-[0_0_28px_rgba(212,175,55,0.2)] sm:h-28"
        />
        <p className="relative mt-4 text-sm tracking-wide text-muted">
          Online &amp; in-person health and fitness coaching.
        </p>
      </header>

      {leadMagnets.length > 0 ? (
        <section className="mt-12">
          <SectionHeading>Free guides</SectionHeading>
          <div className="mt-4 flex flex-col gap-4">
            {leadMagnets.map((lm) => (
              <LeadMagnetCard key={lm.id} leadMagnet={lm} />
            ))}
          </div>
        </section>
      ) : null}

      {PAID_OFFERS.length > 0 ? (
        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading>Work with me</SectionHeading>
          <div className="mt-4 flex flex-col gap-3">
            {PAID_OFFERS.map((offer) => (
              <a
                key={offer.title}
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-accent bg-surface p-4 text-center font-medium text-accent transition-all hover:-translate-y-0.5 hover:bg-accent/5"
              >
                {offer.title}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="mt-12 border-t border-border pt-10">
          <SectionHeading>Client transformations</SectionHeading>
          <div className="mt-4 flex flex-col gap-4">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 border-t border-border pt-10">
        <Link
          href="/book"
          className="block rounded-lg bg-accent px-4 py-4 text-center font-semibold text-accent-foreground shadow-lg shadow-accent/10 transition-all hover:-translate-y-0.5 hover:shadow-accent/20"
        >
          Book a free consultation call
        </Link>
      </section>

      <footer className="mt-16 border-t border-border pt-6 text-center">
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
      <span className="h-px w-4 bg-accent" aria-hidden />
      {children}
    </h2>
  );
}
