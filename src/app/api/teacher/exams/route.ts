import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { examSchema } from "@/lib/validation";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const exams = await prisma.exam.findMany({
      where: { teacherId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true, codes: true } },
      },
    });
    return NextResponse.json({ exams });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();
    const body = await req.json().catch(() => null);
    const parsed = examSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: { ...parsed.data, teacherId },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
