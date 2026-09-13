import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (session.userId) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
