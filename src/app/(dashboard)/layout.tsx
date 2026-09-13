import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar userName={user.name} />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
