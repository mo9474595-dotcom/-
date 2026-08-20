import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";
import { generateExamCode } from "@/lib/exam-codes";
import { z } from "zod";

type RouteParams = { params: Promise<{ examId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const codes = await prisma.examCode.findMany({
      where: { examId },
      orderBy: { createdAt: "desc" },
      include: { attempt: { select: { status: true, score: true } } },
    });

    return NextResponse.json({ codes });
  } catch (err) {
    return handleApiError(err);
  }
}

const generateSchema = z.object({
  count: z.coerce.number().int().min(1).max(500).default(1),
  studentNames: z.array(z.string().trim().max(150)).optional(),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const body = await req.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { studentNames } = parsed.data;
    const count = studentNames?.length || parsed.data.count;

    const codes: { code: string; studentName: string | null; examId: string }[] =
      [];
    const usedCodes = new Set<string>();
    for (let i = 0; i < count; i++) {
      let code = generateExamCode();
      // Extremely unlikely, but avoid in-batch collisions.
      while (usedCodes.has(code)) code = generateExamCode();
      usedCodes.add(code);
      codes.push({
        code,
        studentName: studentNames?.[i]?.trim() || null,
        examId,
      });
    }

    await prisma.examCode.createMany({ data: codes });
    const created = await prisma.examCode.findMany({
      where: { code: { in: codes.map((c) => c.code) } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ codes: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
