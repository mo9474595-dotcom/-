import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttempt } from "@/lib/exams";
import { recomputeAttemptScore } from "@/lib/grading";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

type RouteParams = { params: Promise<{ attemptId: string }> };

const gradeSchema = z.object({
  answerId: z.string().min(1),
  pointsAwarded: z.coerce.number().min(0),
  feedback: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { attemptId } = await params;
    const attempt = await getOwnedAttempt(teacherId, attemptId);

    const body = await req.json().catch(() => null);
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const answer = await prisma.answer.findUnique({
      where: { id: parsed.data.answerId },
      include: { question: true },
    });
    if (!answer || answer.attemptId !== attemptId) {
      return NextResponse.json({ error: "الإجابة غير موجودة" }, { status: 404 });
    }

    const capped = Math.min(parsed.data.pointsAwarded, answer.question.points);

    await prisma.answer.update({
      where: { id: answer.id },
      data: {
        pointsAwarded: capped,
        isCorrect: capped >= answer.question.points,
        ...(parsed.data.feedback !== undefined ? { feedback: parsed.data.feedback || null } : {}),
      },
    });

    const score = await recomputeAttemptScore(attemptId);

    await logAudit({
      teacherId,
      action: "ATTEMPT_ANSWER_GRADE_SET",
      summary: `صحّح إجابة (${capped}/${answer.question.points}) لـ${attempt.studentName} في "${attempt.exam.title}"`,
      examId: attempt.examId,
    });

    return NextResponse.json({ score });
  } catch (err) {
    return handleApiError(err);
  }
}
