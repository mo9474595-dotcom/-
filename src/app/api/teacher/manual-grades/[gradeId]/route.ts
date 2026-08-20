import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedManualGrade } from "@/lib/exams";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ gradeId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { gradeId } = await params;
    const grade = await getOwnedManualGrade(teacherId, gradeId);

    await prisma.manualGrade.delete({ where: { id: gradeId } });

    await logAudit({
      teacherId,
      action: "MANUAL_GRADE_DELETE",
      summary: `حذف درجة "${grade.title}" (${grade.score}/${grade.maxScore}) لـ${grade.studentProfile.fullName}`,
      classSectionId: grade.studentProfile.classSectionId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
