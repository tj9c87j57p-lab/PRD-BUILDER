import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CoachForm } from "@/components/CoachForm";

export default async function EditCoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const coach = await prisma.coach.findUnique({ where: { id } });

  if (!coach) {
    notFound();
  }

  return <CoachForm coach={coach} />;
}
