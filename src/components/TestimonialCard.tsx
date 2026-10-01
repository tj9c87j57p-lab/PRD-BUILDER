import type { Testimonial } from "@prisma/client";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const hasPhotos = testimonial.beforePhotoUrl || testimonial.afterPhotoUrl;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-black/20">
      {hasPhotos ? (
        <div className="grid grid-cols-2">
          <PhotoSlot url={testimonial.beforePhotoUrl} label="Before" />
          <PhotoSlot url={testimonial.afterPhotoUrl} label="After" />
        </div>
      ) : null}
      <div className="p-5">
        <p className="text-sm leading-relaxed text-foreground">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="h-px w-3 bg-accent" aria-hidden />
          {testimonial.clientName}
        </p>
      </div>
    </div>
  );
}

function PhotoSlot({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex h-52 items-center justify-center bg-background text-xs text-muted">
        {label}
      </div>
    );
  }

  return (
    <div className="relative h-52 bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-full w-full object-contain" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        {label}
      </span>
    </div>
  );
}
