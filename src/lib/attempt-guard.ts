import { prisma } from "@/lib/prisma";
import { getExamSessionToken } from "@/lib/exam-session";
import { ForbiddenError } from "@/lib/api-utils";
import { finalizeAttempt } from "@/lib/grading";
import type { ExamAttempt } from "@prisma/client";

/**
 * Loads an attempt and verifies the request's httpOnly cookie matches the
 * token bound to it at creation time. This is what stops a second device
 * (or a copy-pasted URL) from continuing someone else's exam attempt.
 */
export async function getVerifiedAttempt(attemptId: string): Promise<ExamAttempt> {
  const token = await getExamSessionToken(attemptId);
  if (!token) {
    throw new ForbiddenError("انتهت صلاحية الجلسة، الرجاء الدخول برمز الامتحان من جديد");
  }

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.sessionToken !== token) {
    throw new ForbiddenError("هذه الجلسة غير صالحة لهذه المحاولة");
  }

  return attempt;
}

/**
 * If the attempt is still IN_PROGRESS but the server-authoritative deadline
 * has passed, closes it out (AUTO_SUBMITTED) and grades whatever was saved.
 * The client-side timer is only a display; this is what actually enforces it.
 */
export async function closeIfExpired(attempt: ExamAttempt): Promise<ExamAttempt> {
  if (attempt.status !== "IN_PROGRESS") return attempt;
  if (Date.now() < attempt.deadlineAt.getTime()) return attempt;

  await finalizeAttempt(attempt.id, "AUTO_SUBMITTED");
  return prisma.examAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
}
