import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { TaskList } from "@/components/TaskList";

// Live aggregates over Prisma data with no searchParams to key off of — the
// same shape that got silently statically prerendered on `/` (Milestone 5)
// and `/book` (Milestone 6). Force dynamic from the start.
export const dynamic = "force-dynamic";

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function DashboardPage() {
  const now = new Date();
  const todayEnd = endOfLocalDay(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [pipelineAgg, overdueCount, dueTodayCount, newLeadsCount, dueTasks] =
    await Promise.all([
      prisma.deal.aggregate({
        _sum: { valueCents: true },
        where: { stage: { name: { notIn: ["Won", "Lost"] } } },
      }),
      prisma.task.count({
        where: { completedAt: null, dueAt: { lt: now } },
      }),
      prisma.task.count({
        where: { completedAt: null, dueAt: { gte: now, lte: todayEnd } },
      }),
      prisma.contact.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.task.findMany({
        where: { completedAt: null, dueAt: { lte: todayEnd } },
        orderBy: { dueAt: "asc" },
        take: 10,
        include: { contact: true, deal: { include: { contact: true } } },
      }),
    ]);

  const pipelineValue = pipelineAgg._sum.valueCents ?? 0;

  const stats = [
    { label: "Pipeline value", value: formatCents(pipelineValue) },
    { label: "Due today", value: String(dueTodayCount) },
    { label: "Overdue", value: String(overdueCount) },
    { label: "New leads this week", value: String(newLeadsCount) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Due today &amp; overdue
        </h2>
        <div className="mt-3">
          <TaskList tasks={dueTasks} showEntityLinks />
        </div>
      </div>
    </div>
  );
}
