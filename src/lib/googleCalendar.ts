import { google } from "googleapis";

function getCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
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
}): Promise<CreatedCalendarEvent | null> {
  const calendar = getCalendarClient();
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
