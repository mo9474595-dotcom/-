import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";
import { logAudit } from "@/lib/audit";
import { examUpdateSchema } from "@/lib/validation";
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

const nullableDateTime = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

const updateSchema = examUpdateSchema.extend({
  isPublished: z.coerce.boolean().optional(),
  resultsPublished: z.coerce.boolean().optional(),
  resultsPublishAt: nullableDateTime.optional(),
  opensAt: nullableDateTime.optional(),
  closesAt: nullableDateTime.optional(),
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

    const { opensAt, closesAt, ...rest } = parsed.data;
    if (opensAt && closesAt && opensAt >= closesAt) {
      return NextResponse.json(
        { error: "وقت الفتح يجب أن يكون قبل وقت الإغلاق" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        ...rest,
        ...(opensAt !== undefined ? { opensAt } : {}),
        ...(closesAt !== undefined ? { closesAt } : {}),
      },
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
    const exam = await getOwnedExam(teacherId, examId);

    // Soft delete: hidden immediately, recoverable from the trash page.
    await prisma.exam.update({ where: { id: examId }, data: { deletedAt: new Date() } });
    await logAudit({
      teacherId,
      action: "EXAM_DELETED",
      summary: `تم نقل الامتحان "${exam.title}" إلى سلة المحذوفات`,
      examId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
