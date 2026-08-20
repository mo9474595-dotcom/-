import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createTeacherSession } from "@/lib/auth";
import { teacherLoginSchema } from "@/lib/validation";
import { rateLimitOrResponse, checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const ACCOUNT_LOCKOUT_LIMIT = 6;
const ACCOUNT_LOCKOUT_WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  // Per-IP limit stops a single source from hammering the endpoint.
  const limited = rateLimitOrResponse(req, "teacher-login", 10, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = teacherLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  // Per-account limit, independent of source IP: stops a distributed
  // brute force that spreads guesses for one account across many IPs
  // (which the IP-based limit above can't see).
  const accountKey = `teacher-login-account:${normalizedEmail}`;

  const teacher = await prisma.teacher.findUnique({
    where: { email: normalizedEmail },
  });

  // Constant-shape response whether the email exists or not, to avoid
  // leaking which emails are registered.
  const valid =
    teacher && (await verifyPassword(password, teacher.passwordHash));

  if (!teacher || !valid) {
    const { allowed, retryAfterSeconds } = checkRateLimit(
      accountKey,
      ACCOUNT_LOCKOUT_LIMIT,
      ACCOUNT_LOCKOUT_WINDOW_MS
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "محاولات كثيرة جداً على هذا الحساب، الرجاء الانتظار قليلاً قبل إعادة المحاولة" },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
    return NextResponse.json(
      { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }

  resetRateLimit(accountKey);
  await createTeacherSession(teacher.id, teacher.sessionVersion);

  return NextResponse.json({ id: teacher.id, name: teacher.name });
}
