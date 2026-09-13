import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
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
