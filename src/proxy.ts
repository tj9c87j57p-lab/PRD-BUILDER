import { NextResponse, type NextRequest } from "next/server";
import { getIronSession, nextProxyCookies } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(
    nextProxyCookies(request, response),
    sessionOptions
  );

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
