import type { Testimonial } from "@prisma/client";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const hasPhotos = testimonial.beforePhotoUrl || testimonial.afterPhotoUrl;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {hasPhotos ? (
        <div className="grid grid-cols-2">
          <PhotoSlot url={testimonial.beforePhotoUrl} label="Before" />
          <PhotoSlot url={testimonial.afterPhotoUrl} label="After" />
        </div>
      ) : null}
      <div className="p-5">
        <p className="text-sm text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">
          {testimonial.clientName}
        </p>
      </div>
    </div>
  );
}

function PhotoSlot({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center bg-background text-xs text-muted">
        {label}
      </div>
    );
  }

  return (
    <div className="relative h-40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        {label}
      </span>
    </div>
  );
}
