import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ToggleLeadMagnetButton } from "@/components/ToggleLeadMagnetButton";

export default async function LeadsPage() {
  const leadMagnets = await prisma.leadMagnet.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Leads
        </h1>
        <Link
          href="/leads/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Add Lead Magnet
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {leadMagnets.length === 0 ? (
          <p className="text-sm text-muted">No lead magnets yet.</p>
        ) : (
          leadMagnets.map((lm) => (
            <div
              key={lm.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{lm.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {lm.active ? "Active — listed on the public page" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/leads/${lm.id}/edit`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Edit
                </Link>
                <ToggleLeadMagnetButton id={lm.id} active={lm.active} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
