import { prisma } from "@/lib/prisma";
import { DealForm } from "@/components/DealForm";

export default async function NewDealPage() {
  const [contacts, stages] = await Promise.all([
    prisma.contact.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.stage.findMany({
      select: { id: true, name: true },
      orderBy: { position: "asc" },
    }),
  ]);

  return <DealForm contacts={contacts} stages={stages} />;
}
