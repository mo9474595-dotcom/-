import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { getVerifiedAttempt, closeIfExpired } from "@/lib/attempt-guard";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    let attempt = await getVerifiedAttempt(attemptId);
    attempt = await closeIfExpired(attempt);

    const exam = await prisma.exam.findUnique({ where: { id: attempt.examId } });
    if (!exam) throw new Error("Exam missing for attempt");

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({
        status: attempt.status,
        exam: { title: exam.title },
      });
    }

    const questions = await prisma.question.findMany({
      where: { examId: attempt.examId },
      include: { choices: true },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    const order: string[] = JSON.parse(attempt.questionOrder);
    const choiceOrderMap: Record<string, string[]> = JSON.parse(
      attempt.choiceOrderMap
    );

    const answers = await prisma.answer.findMany({ where: { attemptId } });
    const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

    const questionPayload = order
      .map((qid) => questionById.get(qid))
      .filter((q): q is (typeof questions)[number] => Boolean(q))
      .map((q) => {
        const choiceById = new Map(q.choices.map((c) => [c.id, c]));
        const orderedChoiceIds = choiceOrderMap[q.id] ?? q.choices.map((c) => c.id);
        const existingAnswer = answerByQuestionId.get(q.id);
        return {
          id: q.id,
          type: q.type,
          text: q.text,
          points: q.points,
          imageUrl: q.imageUrl,
          // isCorrect is intentionally withheld from students.
          choices: orderedChoiceIds
            .map((cid) => choiceById.get(cid))
            .filter((c): c is (typeof q.choices)[number] => Boolean(c))
            .map((c) => ({ id: c.id, text: c.text })),
          savedSelectedChoiceId: existingAnswer?.selectedChoiceId ?? null,
          savedTextAnswer: existingAnswer?.textAnswer ?? null,
        };
      });

    return NextResponse.json({
      status: attempt.status,
      exam: {
        title: exam.title,
        maxTabViolations: exam.maxTabViolations,
      },
      deadlineAt: attempt.deadlineAt,
      serverNow: new Date().toISOString(),
      tabViolations: attempt.tabViolations,
      questions: questionPayload,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
