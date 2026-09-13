import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { DeleteDealButton } from "@/components/DeleteDealButton";

const rowClasses = "flex gap-2 py-2";
const labelClasses =
  "w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { contact: true, stage: true },
  });

  if (!deal) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {formatCents(deal.valueCents)} — {deal.contact.name}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/deals/${deal.id}/edit`}
            className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-accent"
          >
            Edit
          </Link>
          <DeleteDealButton
            dealId={deal.id}
            dealLabel={`${deal.contact.name} (${formatCents(deal.valueCents)})`}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <div className={rowClasses}>
          <span className={labelClasses}>Contact</span>
          <Link
            href={`/contacts/${deal.contact.id}`}
            className="text-foreground hover:text-accent"
          >
            {deal.contact.name}
          </Link>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Stage</span>
          <span className="text-foreground">{deal.stage.name}</span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Value</span>
          <span className="text-foreground">
            {formatCents(deal.valueCents)}
          </span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>Expected close date</span>
          <span className="text-foreground">
            {formatDate(deal.expectedCloseDate)}
          </span>
        </div>
        <div className={rowClasses}>
          <span className={labelClasses}>In current stage since</span>
          <span className="text-foreground">
            {formatDate(deal.stageEnteredAt)}
          </span>
        </div>
        <div className={`${rowClasses} mt-2 border-t border-border pt-4`}>
          <span className={labelClasses}>Notes</span>
          <span className="whitespace-pre-wrap text-foreground">
            {deal.notes || "—"}
          </span>
        </div>
      </div>

      <Link
        href="/deals"
        className="mt-4 inline-block text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Back to pipeline
      </Link>
    </div>
  );
}
