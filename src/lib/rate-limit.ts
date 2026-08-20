import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

// In-memory sliding-ish (fixed-window) limiter. Good enough for a single
// Node process; if this app is ever deployed across multiple instances,
// swap this for a shared store (e.g. Redis / Upstash) — a per-process map
// can't see requests handled by a sibling instance.
const buckets = new Map<string, Bucket>();
let opCount = 0;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  opCount += 1;
  if (opCount % 500 === 0) sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears a bucket outright — used to reset a per-account limiter on a successful action. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function getClientIp(req: NextRequest): string {
  // x-forwarded-for/x-real-ip are only trustworthy if a reverse proxy in
  // front of this app sets them itself and strips any client-supplied
  // value — otherwise a client can put anything it likes in that header
  // and get a fresh rate-limit bucket on every request. Next.js's own
  // `next start` server also sets x-forwarded-for to a constant local
  // address internally, which would otherwise pool every real visitor
  // into one bucket. So those headers are only used when the deployer has
  // explicitly confirmed (via TRUST_PROXY_HEADERS=true) that a proxy they
  // control is sanitizing them; the per-browser cookie id is used
  // otherwise, since it's assigned by this server and can't be spoofed by
  // the client the way a request header can.
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }
  return req.cookies.get("rl_id")?.value ?? "unknown";
}

/**
 * Applies a rate limit for this request, scoped by client IP + a route
 * name you choose. Returns a 429 NextResponse if the limit was exceeded,
 * or null if the caller should proceed.
 */
export function rateLimitOrResponse(
  req: NextRequest,
  routeName: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(`${routeName}:${ip}`, limit, windowMs);
  if (allowed) return null;

  return NextResponse.json(
    { error: "محاولات كثيرة جداً، الرجاء الانتظار قليلاً قبل إعادة المحاولة" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
