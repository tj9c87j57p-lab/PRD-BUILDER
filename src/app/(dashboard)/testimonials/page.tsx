import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleTestimonialButton } from "@/components/ToggleTestimonialButton";
import { DeleteTestimonialButton } from "@/components/DeleteTestimonialButton";

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Testimonials
        </h1>
        <Link
          href="/testimonials/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Add Testimonial
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {testimonials.length === 0 ? (
          <p className="text-sm text-muted">No testimonials yet.</p>
        ) : (
          testimonials.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{t.clientName}</p>
                <p className="mt-1 max-w-md truncate text-xs text-muted">
                  {t.quote}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t.active ? "Active — listed on the public page" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/testimonials/${t.id}/edit`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Edit
                </Link>
                <ToggleTestimonialButton id={t.id} active={t.active} />
                <DeleteTestimonialButton
                  testimonialId={t.id}
                  clientName={t.clientName}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
