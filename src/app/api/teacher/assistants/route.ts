import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId, hashPassword } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { assistantSchema } from "@/lib/validation";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const assistants = await prisma.teacher.findMany({
      where: { ownerId: teacherId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json({ assistants });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();

    // An assistant account can't itself invite further assistants — only a
    // real, independent teacher account owns assistants.
    const self = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { ownerId: true },
    });
    if (self?.ownerId) {
      return NextResponse.json(
        { error: "حساب المساعد لا يملك صلاحية إضافة مساعدين آخرين" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = assistantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.teacher.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "هذا البريد الإلكتروني مسجل بالفعل" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assistant = await prisma.teacher.create({
      data: { name, email: normalizedEmail, passwordHash, ownerId: teacherId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ assistant }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
