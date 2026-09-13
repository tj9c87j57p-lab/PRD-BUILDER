import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export default async function EditLeadMagnetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const leadMagnet = await prisma.leadMagnet.findUnique({ where: { id } });

  if (!leadMagnet) {
    notFound();
  }

  return <LeadMagnetForm leadMagnet={leadMagnet} />;
}
