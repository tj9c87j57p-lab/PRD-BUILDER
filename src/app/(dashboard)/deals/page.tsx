import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function DealsPage() {
  const stages = await prisma.stage.findMany({
    orderBy: { position: "asc" },
    include: {
      deals: {
        include: { contact: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Deals
        </h1>
        <Link
          href="/deals/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          New Deal
        </Link>
      </div>

      <div className="mt-6">
        <KanbanBoard stages={stages} />
      </div>
    </div>
  );
}
