"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { sessionOptions, type SessionData } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.userId = user.id;
  await session.save();

  redirect("/dashboard");
}
