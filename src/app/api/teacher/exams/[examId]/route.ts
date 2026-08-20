import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";
import { examSchema } from "@/lib/validation";
import { z } from "zod";

type RouteParams = { params: Promise<{ examId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { choices: { orderBy: { order: "asc" } } },
        },
        _count: { select: { attempts: true, codes: true } },
      },
    });

    return NextResponse.json({ exam });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSchema = examSchema.partial().extend({
  isPublished: z.coerce.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: parsed.data,
    });

    return NextResponse.json({ exam });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    await prisma.exam.delete({ where: { id: examId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
