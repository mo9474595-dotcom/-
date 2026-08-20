import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createTeacherSession } from "@/lib/auth";
import { teacherLoginSchema } from "@/lib/validation";
import { rateLimitOrResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
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
  const teacher = await prisma.teacher.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Constant-shape response whether the email exists or not, to avoid
  // leaking which emails are registered.
  const valid =
    teacher && (await verifyPassword(password, teacher.passwordHash));

  if (!teacher || !valid) {
    return NextResponse.json(
      { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }

  await createTeacherSession(teacher.id);

  return NextResponse.json({ id: teacher.id, name: teacher.name });
}
