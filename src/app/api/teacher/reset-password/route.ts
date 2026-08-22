import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashResetToken } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { rateLimitOrResponse } from "@/lib/rate-limit";

const INVALID_MESSAGE = "الرابط غير صالح أو منتهي الصلاحية، يرجى طلب رابط جديد";

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "reset-password", 10, 60 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: resetToken.teacherId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    // Mark every outstanding token for this account used, not just the one
    // consumed here, so an older reset link (e.g. from a previous request,
    // or one that leaked) can't be replayed after this reset.
    prisma.passwordResetToken.updateMany({
      where: { teacherId: resetToken.teacherId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
