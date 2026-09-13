import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TaskList } from "@/components/TaskList";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    where: { completedAt: null },
    orderBy: { dueAt: "asc" },
    include: { contact: true, deal: { include: { contact: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Tasks
        </h1>
        <Link
          href="/tasks/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Add Task
        </Link>
      </div>

      <div className="mt-6">
        <TaskList tasks={tasks} showEntityLinks />
      </div>
    </div>
  );
}
