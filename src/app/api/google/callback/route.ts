import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const coachesUrl = new URL("/coaches", request.url);

  if (params.get("error")) {
    coachesUrl.searchParams.set("googleError", params.get("error")!);
    return NextResponse.redirect(coachesUrl);
  }

  const code = params.get("code");
  const coachId = params.get("state");
  if (!code || !coachId) {
    coachesUrl.searchParams.set("googleError", "missing_code");
    return NextResponse.redirect(coachesUrl);
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) {
    coachesUrl.searchParams.set("googleError", "coach_not_found");
    return NextResponse.redirect(coachesUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    coachesUrl.searchParams.set("googleError", "not_configured");
    return NextResponse.redirect(coachesUrl);
  }

  const redirectUri = new URL("/api/google/callback", request.nextUrl.origin).toString();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      // Google only issues a refresh token on first consent (or with
      // prompt=consent, which /api/google/connect always sends) — missing
      // one here means the exchange itself is the problem, not the grant.
      coachesUrl.searchParams.set("googleError", "no_refresh_token");
      return NextResponse.redirect(coachesUrl);
    }

    await prisma.coach.update({
      where: { id: coachId },
      data: { googleRefreshToken: tokens.refresh_token },
    });
  } catch (error) {
    console.error("[google/callback] token exchange failed:", error);
    coachesUrl.searchParams.set("googleError", "exchange_failed");
    return NextResponse.redirect(coachesUrl);
  }

  coachesUrl.searchParams.set("connected", coach.name);
  return NextResponse.redirect(coachesUrl);
}
