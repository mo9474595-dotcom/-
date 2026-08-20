import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api-utils";

/**
 * Loads an exam and verifies it belongs to the given teacher.
 * Returns the same "not found" error whether the exam doesn't exist or
 * belongs to someone else, so we never leak which exam IDs exist.
 */
export async function getOwnedExam(teacherId: string, examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId) {
    throw new NotFoundError("الامتحان غير موجود");
  }
  return exam;
}

export async function getOwnedAttempt(teacherId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.exam.teacherId !== teacherId) {
    throw new NotFoundError("المحاولة غير موجودة");
  }
  return attempt;
}

export async function getOwnedQuestion(teacherId: string, questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { exam: true },
  });
  if (!question || question.exam.teacherId !== teacherId) {
    throw new NotFoundError("السؤال غير موجود");
  }
  return question;
}
