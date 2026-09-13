import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealForm } from "@/components/DealForm";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deal, contacts, stages] = await Promise.all([
    prisma.deal.findUnique({ where: { id } }),
    prisma.contact.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.stage.findMany({
      select: { id: true, name: true },
      orderBy: { position: "asc" },
    }),
  ]);

  if (!deal) {
    notFound();
  }

  return <DealForm deal={deal} contacts={contacts} stages={stages} />;
}
