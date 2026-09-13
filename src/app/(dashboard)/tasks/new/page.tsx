import { prisma } from "@/lib/prisma";
import { TaskForm } from "@/components/TaskForm";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; dealId?: string }>;
}) {
  const { contactId, dealId } = await searchParams;

  const [contacts, deals] = await Promise.all([
    prisma.contact.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.deal.findMany({
      select: { id: true, valueCents: true, contact: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <TaskForm
      contacts={contacts}
      deals={deals}
      defaultContactId={contactId}
      defaultDealId={dealId}
    />
  );
}
