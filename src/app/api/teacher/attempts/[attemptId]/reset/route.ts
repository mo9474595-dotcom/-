import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttempt } from "@/lib/exams";
import { logAudit } from "@/lib/audit";

type RouteParams = { params: Promise<{ attemptId: string }> };

const statusLabelsAr: Record<string, string> = {
  IN_PROGRESS: "قيد الحل",
  SUBMITTED: "تم التسليم",
  AUTO_SUBMITTED: "تسليم تلقائي",
  TERMINATED: "أُنهي (مخالفات)",
};

/**
 * Voids a stuck or otherwise problematic attempt: deletes it (cascading its
 * answers and cheat logs) and frees its exam code so the student can join
 * again from scratch. Used when a student is locked out by a crashed
 * browser / cleared cookies, or when a teacher wants to let someone retake
 * after a dispute.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { attemptId } = await params;
    const attempt = await getOwnedAttempt(teacherId, attemptId);

    await prisma.$transaction([
      prisma.examAttempt.delete({ where: { id: attemptId } }),
      prisma.examCode.update({
        where: { id: attempt.examCodeId },
        data: { usedAt: null },
      }),
    ]);

    await logAudit({
      teacherId,
      action: "ATTEMPT_RESET",
      summary: `أعاد تعيين محاولة ${attempt.studentName} في "${attempt.exam.title}" (كانت الحالة: ${
        statusLabelsAr[attempt.status] ?? attempt.status
      })`,
      examId: attempt.examId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
