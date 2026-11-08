import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPE = "https://www.googleapis.com/auth/calendar";

// Kicks off the Google consent screen for a specific coach, so reconnecting
// a calendar is a single click from the admin panel instead of a manual
// OAuth Playground round trip. Lands back at /api/google/callback, which
// exchanges the code and saves the refresh token straight to that Coach row.
export async function GET(request: NextRequest) {
  const coachId = request.nextUrl.searchParams.get("coachId");
  if (!coachId) {
    return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) {
    return NextResponse.json({ error: "Coach not found" }, { status: 404 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/coaches?googleError=not_configured", request.url)
    );
  }

  const redirectUri = new URL("/api/google/callback", request.nextUrl.origin).toString();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [SCOPE],
    state: coachId,
  });

  return NextResponse.redirect(authUrl);
}
