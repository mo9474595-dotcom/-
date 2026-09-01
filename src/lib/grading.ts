import { prisma } from "@/lib/prisma";
import type { AttemptStatus } from "@prisma/client";

/**
 * Sums up pointsAwarded across all answers for an attempt and persists the
 * result on ExamAttempt.score. Safe to call repeatedly (e.g. every time a
 * teacher grades one more short-answer question).
 */
export async function recomputeAttemptScore(attemptId: string) {
  const answers = await prisma.answer.findMany({
    where: { attemptId },
    select: { pointsAwarded: true },
  });

  const score = answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: { score },
    select: { score: true, maxScore: true },
  });
}

const FINALIZE_MESSAGES: Record<string, (studentName: string, examTitle: string) => string> = {
  SUBMITTED: (s, e) => `قام الطالب "${s}" بتسليم امتحان "${e}"`,
  AUTO_SUBMITTED: (s, e) => `انتهى وقت الطالب "${s}" في امتحان "${e}" وتم التسليم تلقائياً`,
  TERMINATED: (s, e) => `تم إنهاء محاولة الطالب "${s}" في امتحان "${e}" بسبب مخالفات متكررة`,
};

/**
 * Ends an in-progress attempt (submitted / auto-submitted / terminated),
 * stamping maxScore and grading whatever was answered. Used on manual
 * submit, server-side deadline expiry, and cheat-violation termination.
 */
export async function finalizeAttempt(attemptId: string, status: AttemptStatus) {
  const attempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });

  const exam = await prisma.exam.findUniqueOrThrow({
    where: { id: attempt.examId },
    select: {
      id: true,
      title: true,
      teacherId: true,
      questions: { select: { id: true, points: true } },
    },
  });
  // Scoped to the questions actually assigned to this attempt (its
  // questionOrder), not every question the exam has — with a randomized
  // question pool, those can differ, and summing every question's points
  // would overstate what this student could possibly have scored.
  const assignedQuestionIds = new Set<string>(JSON.parse(attempt.questionOrder));
  const maxScore = exam.questions
    .filter((q) => assignedQuestionIds.has(q.id))
    .reduce((sum, q) => sum + q.points, 0);

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { status, submittedAt: new Date(), maxScore },
  });

  const result = await recomputeAttemptScore(attemptId);

  const buildMessage = FINALIZE_MESSAGES[status];
  if (buildMessage) {
    await prisma.notification.create({
      data: {
        teacherId: exam.teacherId,
        type: status,
        message: buildMessage(attempt.studentName, exam.title),
        link: `/teacher/exams/${exam.id}/results`,
      },
    });
  }

  return result;
}
