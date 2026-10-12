import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionData } from "@/lib/session";
import { exchangeCodeForRefreshToken } from "@/lib/googleCalendar";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  const pending = session.googleOAuth;
  session.googleOAuth = undefined;
  await session.save();

  if (!pending || params.get("state") !== pending.state) {
    redirect("/coaches?google=error&reason=state-mismatch");
  }
  // e.g. "access_denied" when the user cancels on Google's consent screen.
  if (params.get("error")) {
    redirect(`/coaches?google=error&reason=${encodeURIComponent(params.get("error")!)}`);
  }
  const code = params.get("code");
  if (!code) {
    redirect("/coaches?google=error&reason=missing-code");
  }

  let refreshToken: string | null = null;
  try {
    refreshToken = await exchangeCodeForRefreshToken({
      redirectUri: new URL("/api/google/callback", request.nextUrl.origin).toString(),
      code,
    });
  } catch (error) {
    console.error("[google] token exchange failed:", error);
  }
  if (!refreshToken) {
    redirect("/coaches?google=error&reason=token-exchange-failed");
  }

  await prisma.coach.update({
    where: { id: pending.coachId },
    data: { googleRefreshToken: refreshToken },
  });

  revalidatePath("/coaches");
  redirect("/coaches?google=connected");
}
