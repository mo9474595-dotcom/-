import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttempt } from "@/lib/exams";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { attemptId } = await params;
    const attempt = await getOwnedAttempt(teacherId, attemptId);

    const [questions, answers, cheatLogs, examCode] = await Promise.all([
      prisma.question.findMany({
        where: { examId: attempt.examId },
        include: { choices: true },
        orderBy: { order: "asc" },
      }),
      prisma.answer.findMany({ where: { attemptId } }),
      prisma.cheatLog.findMany({
        where: { attemptId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.examCode.findUnique({ where: { id: attempt.examCodeId } }),
    ]);

    const order: string[] = JSON.parse(attempt.questionOrder);
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

    const items = order
      .map((qid) => questionById.get(qid))
      .filter((q): q is (typeof questions)[number] => Boolean(q))
      .map((q) => ({
        question: q,
        answer: answerByQuestionId.get(q.id) ?? null,
      }));

    return NextResponse.json({ attempt, examCode, items, cheatLogs });
  } catch (err) {
    return handleApiError(err);
  }
}
