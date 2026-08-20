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
  fromClassId: z.string().min(1).optional(),
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

    let codes: {
      code: string;
      studentName: string | null;
      studentProfileId: string | null;
      examId: string;
    }[] = [];
    const usedCodes = new Set<string>();

    function nextCode() {
      let code = generateExamCode();
      // Extremely unlikely, but avoid in-batch collisions.
      while (usedCodes.has(code)) code = generateExamCode();
      usedCodes.add(code);
      return code;
    }

    if (parsed.data.fromClassId) {
      const classSection = await prisma.classSection.findUnique({
        where: { id: parsed.data.fromClassId },
      });
      if (!classSection || classSection.teacherId !== teacherId) {
        return NextResponse.json({ error: "الشعبة غير موجودة" }, { status: 404 });
      }

      const students = await prisma.studentProfile.findMany({
        where: { classSectionId: parsed.data.fromClassId },
      });
      const existingCodes = await prisma.examCode.findMany({
        where: { examId, studentProfileId: { in: students.map((s) => s.id) } },
        select: { studentProfileId: true },
      });
      const alreadyHasCode = new Set(existingCodes.map((c) => c.studentProfileId));

      codes = students
        .filter((s) => !alreadyHasCode.has(s.id))
        .map((s) => ({
          code: nextCode(),
          studentName: s.fullName,
          studentProfileId: s.id,
          examId,
        }));

      if (codes.length === 0) {
        return NextResponse.json(
          { error: "كل طلاب هذه الشعبة لديهم رمز بالفعل لهذا الامتحان" },
          { status: 400 }
        );
      }
    } else {
      const { studentNames } = parsed.data;
      const count = studentNames?.length || parsed.data.count;
      for (let i = 0; i < count; i++) {
        codes.push({
          code: nextCode(),
          studentName: studentNames?.[i]?.trim() || null,
          studentProfileId: null,
          examId,
        });
      }
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
