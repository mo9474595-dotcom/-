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

/**
 * Ends an in-progress attempt (submitted / auto-submitted / terminated),
 * stamping maxScore and grading whatever was answered. Used on manual
 * submit, server-side deadline expiry, and cheat-violation termination.
 */
export async function finalizeAttempt(attemptId: string, status: AttemptStatus) {
  const attempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });

  const examQuestions = await prisma.question.findMany({
    where: { examId: attempt.examId },
    select: { points: true },
  });
  const maxScore = examQuestions.reduce((sum, q) => sum + q.points, 0);

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { status, submittedAt: new Date(), maxScore },
  });

  return recomputeAttemptScore(attemptId);
}
