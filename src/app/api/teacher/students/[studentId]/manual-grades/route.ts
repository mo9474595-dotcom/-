import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedStudent } from "@/lib/exams";
import { manualGradeSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ studentId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { studentId } = await params;
    const student = await getOwnedStudent(teacherId, studentId);

    const body = await req.json().catch(() => null);
    const parsed = manualGradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const grade = await prisma.manualGrade.create({
      data: {
        studentProfileId: studentId,
        title: parsed.data.title,
        score: parsed.data.score,
        maxScore: parsed.data.maxScore,
        notes: parsed.data.notes || null,
      },
    });

    await logAudit({
      teacherId,
      action: "MANUAL_GRADE_SET",
      summary: `أضاف درجة "${grade.title}" (${grade.score}/${grade.maxScore}) لـ${student.fullName}`,
      classSectionId: student.classSectionId,
    });

    return NextResponse.json({ grade }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
