import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskForm } from "@/components/TaskForm";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [task, contacts, deals] = await Promise.all([
    prisma.task.findUnique({ where: { id } }),
    prisma.contact.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.deal.findMany({
      select: { id: true, valueCents: true, contact: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!task) {
    notFound();
  }

  return <TaskForm task={task} contacts={contacts} deals={deals} />;
}
