import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  // Pending "Connect Google Calendar" flow: the state we sent to Google and
  // which coach the resulting refresh token belongs to.
  googleOAuth?: { state: string; coachId: string };
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is not set.");
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "pcc_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};
