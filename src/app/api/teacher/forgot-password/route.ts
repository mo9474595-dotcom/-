import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimitOrResponse } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE =
  "إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فسنرسل إليه رابط إعادة تعيين كلمة المرور خلال لحظات.";
const TOKEN_TTL_MS = 60 * 60_000; // 1 hour

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "forgot-password", 5, 60 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const teacher = await prisma.teacher.findUnique({ where: { email: normalizedEmail } });
  // TEMPORARY diagnostic log — remove once the "no email received" issue is
  // confirmed fixed. Logs to Vercel's function logs only, never to the client.
  console.log(`[forgot-password][debug] lookup for "${normalizedEmail}": ${teacher ? "FOUND" : "NOT FOUND"}`);

  // Always respond the same way whether or not the account exists — unlike
  // registration (which knowingly reveals a taken email for UX reasons),
  // leaking account existence through a *password recovery* flow is a more
  // sensitive signal, so this endpoint never distinguishes the two cases.
  if (teacher) {
    const { rawToken, tokenHash } = generatePasswordResetToken();
    await prisma.passwordResetToken.create({
      data: { teacherId: teacher.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });
    const resetUrl = `${req.nextUrl.origin}/teacher/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(teacher.email, resetUrl);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
