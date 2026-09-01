import { prisma } from "@/lib/prisma";

export type QuestionReview = {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  text: string;
  imageUrl: string | null;
  points: number;
  pointsAwarded: number | null;
  isCorrect: boolean | null;
  choices: { id: string; text: string; isCorrect: boolean }[];
  selectedChoiceId: string | null;
  textAnswer: string | null;
  correctAnswer: string | null;
};

export type AttemptReview = {
  examTitle: string;
  studentName: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  questions: QuestionReview[];
};

export type AttemptReviewResult =
  | { ok: true; data: AttemptReview }
  | { ok: false; reason: "not_found" | "in_progress" | "not_published" };

// Shared by both student-facing review entry points (the exam-session-cookie
// one right after submitting, and the student-portal one for a later visit)
// so the publish gate and question-ordering logic live in exactly one place.
export async function getAttemptReview(attemptId: string): Promise<AttemptReviewResult> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt) return { ok: false, reason: "not_found" };
  if (attempt.status === "IN_PROGRESS") return { ok: false, reason: "in_progress" };
  if (!attempt.exam.resultsPublished) return { ok: false, reason: "not_published" };

  const questions = await prisma.question.findMany({
    where: { examId: attempt.examId },
    include: { choices: true },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const order: string[] = JSON.parse(attempt.questionOrder);
  const choiceOrderMap: Record<string, string[]> = JSON.parse(attempt.choiceOrderMap);

  const answers = await prisma.answer.findMany({ where: { attemptId } });
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

  const questionReviews: QuestionReview[] = order
    .map((qid) => questionById.get(qid))
    .filter((q): q is (typeof questions)[number] => Boolean(q))
    .map((q) => {
      const choiceById = new Map(q.choices.map((c) => [c.id, c]));
      const orderedChoiceIds = choiceOrderMap[q.id] ?? q.choices.map((c) => c.id);
      const answer = answerByQuestionId.get(q.id);
      return {
        id: q.id,
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl,
        points: q.points,
        pointsAwarded: answer?.pointsAwarded ?? null,
        isCorrect: answer?.isCorrect ?? null,
        choices: orderedChoiceIds
          .map((cid) => choiceById.get(cid))
          .filter((c): c is (typeof q.choices)[number] => Boolean(c))
          .map((c) => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
        selectedChoiceId: answer?.selectedChoiceId ?? null,
        textAnswer: answer?.textAnswer ?? null,
        correctAnswer: q.type === "SHORT_ANSWER" ? q.correctAnswer : null,
      };
    });

  return {
    ok: true,
    data: {
      examTitle: attempt.exam.title,
      studentName: attempt.studentName,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      questions: questionReviews,
    },
  };
}
