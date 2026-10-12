import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionData } from "@/lib/session";
import { getGoogleAuthUrl } from "@/lib/googleCalendar";

// Admin-only (not in the proxy's public paths). Starts the Google consent
// flow for one coach; Google sends the user back to /api/google/callback.
export async function GET(request: NextRequest) {
  const coachId = request.nextUrl.searchParams.get("coachId") ?? "";
  const coach = coachId
    ? await prisma.coach.findUnique({ where: { id: coachId } })
    : null;
  if (!coach) {
    redirect("/coaches?google=error&reason=coach-not-found");
  }

  const state = randomBytes(24).toString("hex");
  const url = getGoogleAuthUrl({
    redirectUri: new URL("/api/google/callback", request.nextUrl.origin).toString(),
    state,
    loginHint: coach.email,
  });
  if (!url) {
    redirect("/coaches?google=error&reason=not-configured");
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.googleOAuth = { state, coachId: coach.id };
  await session.save();

  redirect(url);
}
