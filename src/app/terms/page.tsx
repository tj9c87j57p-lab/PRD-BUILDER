import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Precision Coach",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: October 6, 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <p>
          These terms govern your use of precisioncoach.site and the booking
          and lead-request features on it. By using this site, you agree to
          these terms.
        </p>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Bookings
          </h2>
          <p className="mt-2">
            Booking a call through this site reserves a time slot with a
            coach. We send a confirmation email and, where available, a
            calendar invite with a video call link. Please contact us as soon
            as possible if you need to reschedule or cancel.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Not medical advice
          </h2>
          <p className="mt-2">
            Coaching provided through this site is for general health and
            fitness guidance only and is not a substitute for professional
            medical advice. Consult a physician before beginning any new
            exercise or nutrition program.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Site use
          </h2>
          <p className="mt-2">
            You agree to provide accurate information when requesting
            resources or booking a call, and not to misuse the site or
            attempt to disrupt its operation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Changes
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. Continued use of
            the site after changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2">
            Questions about these terms? Reach us at{" "}
            <a
              href="mailto:info@precisioncoach.site"
              className="text-accent underline-offset-2 hover:underline"
            >
              info@precisioncoach.site
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-border pt-6">
        <Link
          href="/"
          className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Back to home
        </Link>
      </footer>
    </main>
  );
}
