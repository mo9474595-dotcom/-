import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "rl_id";

// Assigns each browser a random, unguessable id so the rate limiter can
// scope its buckets per-device even when no x-forwarded-for/x-real-ip
// header is present (e.g. no reverse proxy in front of the app). Without
// this, every visitor with no such header would fall into one shared
// "unknown" bucket and a single busy client could exhaust it for everyone
// else.
export function middleware(req: NextRequest) {
  if (req.cookies.get(COOKIE_NAME)) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = {
  // Broad on purpose: the cookie must exist *before* a client's first POST
  // to a rate-limited endpoint, and that POST is normally preceded by a
  // page visit (the login/register/join form itself) which may not be one
  // of the rate-limited routes. Matching every page load — not just the
  // API routes — means that preceding visit is what assigns the id.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
