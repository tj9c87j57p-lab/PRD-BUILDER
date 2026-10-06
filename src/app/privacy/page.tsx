import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Precision Coach",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: October 6, 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-foreground">
        <p>
          Precision Coach (&quot;we,&quot; &quot;us&quot;) provides online and
          in-person health and fitness coaching. This policy explains what
          information we collect through precisioncoach.site and how we use
          it.
        </p>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Information we collect
          </h2>
          <p className="mt-2">
            When you request a free guide, book a call, or otherwise contact
            us through this site, we collect the information you provide
            directly, such as your name, email address, and phone number.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            How we use it
          </h2>
          <p className="mt-2">
            We use this information to respond to inquiries, schedule and
            confirm coaching calls, send appointment reminders and the
            resources you request, and manage our client relationships. If
            you book a call, we create a calendar event for that call using
            Google Calendar, and may generate a Google Meet video link for
            it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Sharing
          </h2>
          <p className="mt-2">
            We do not sell your personal information. We share information
            only with service providers who help us run this site and our
            coaching business — for example, email delivery, calendar
            scheduling, and file storage providers — solely to provide those
            services to us.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Your choices
          </h2>
          <p className="mt-2">
            You can ask us to access, correct, or delete the information we
            hold about you at any time by contacting us at the email address
            below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2">
            Questions about this policy? Reach us at{" "}
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
