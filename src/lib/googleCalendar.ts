import { google } from "googleapis";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

// The redirect URI must be listed under "Authorized redirect URIs" on the
// OAuth client in Google Cloud Console.
function getOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGoogleAuthUrl(input: {
  redirectUri: string;
  state: string;
  loginHint?: string;
}): string | null {
  const auth = getOAuthClient(input.redirectUri);
  if (!auth) return null;
  return auth.generateAuthUrl({
    access_type: "offline",
    // Force the consent screen so Google always returns a refresh token,
    // even if this account authorized the app before.
    prompt: "consent",
    scope: [CALENDAR_SCOPE],
    state: input.state,
    login_hint: input.loginHint,
  });
}

export async function exchangeCodeForRefreshToken(input: {
  redirectUri: string;
  code: string;
}): Promise<string | null> {
  const auth = getOAuthClient(input.redirectUri);
  if (!auth) return null;
  const { tokens } = await auth.getToken(input.code);
  return tokens.refresh_token ?? null;
}

function getCalendarClient(coachRefreshToken?: string | null) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  // Coaches share one registered OAuth app (client id/secret) but each
  // authorizes their own calendar, producing their own refresh token.
  // Falling back to the env var keeps the original coach working without
  // re-authorizing after this became per-coach.
  const refreshToken = coachRefreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.calendar({ version: "v3", auth });
}

export interface CreatedCalendarEvent {
  eventId: string | null;
  meetLink: string | null;
}

export async function createCalendarEvent(input: {
  summary: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  attendeeEmail?: string;
  coachRefreshToken?: string | null;
}): Promise<CreatedCalendarEvent | null> {
  const calendar = getCalendarClient(input.coachRefreshToken);
  if (!calendar) {
    console.log("[googleCalendar] not configured, skipping event push", input);
    return null;
  }

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startAt.toISOString() },
      end: { dateTime: input.endAt.toISOString() },
      attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return {
    eventId: res.data.id ?? null,
    meetLink: res.data.hangoutLink ?? null,
  };
}
