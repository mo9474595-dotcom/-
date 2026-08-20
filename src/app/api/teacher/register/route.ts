import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createTeacherSession } from "@/lib/auth";
import { teacherRegisterSchema } from "@/lib/validation";
import { rateLimitOrResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Generous enough to not trip up a school computer lab registering
  // several teacher accounts from behind the same shared IP in one sitting,
  // while still blocking sustained automated account-spam.
  const limited = rateLimitOrResponse(req, "teacher-register", 30, 60 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = teacherRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.teacher.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "هذا البريد الإلكتروني مسجل بالفعل" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const teacher = await prisma.teacher.create({
    data: { name, email: normalizedEmail, passwordHash },
  });

  await createTeacherSession(teacher.id);

  return NextResponse.json({ id: teacher.id, name: teacher.name });
}
