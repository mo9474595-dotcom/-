import { prisma } from "@/lib/prisma";

export type SuspiciousPair = {
  attemptAId: string;
  studentA: string;
  attemptBId: string;
  studentB: string;
  sharedWrongCount: number;
  totalCommonQuestions: number;
  sharedWrongQuestions: string[];
};

// Matching *wrong* answers between two students is a far stronger signal
// than matching correct ones (everyone legitimately converges on the right
// choice) — flags pairs whose finished attempts picked the exact same
// incorrect option on several of the same multiple-choice/true-false
// questions. Purely additive/read-only: no accusation is recorded anywhere,
// it's just surfaced for the teacher to look into.
const MIN_SHARED_WRONG = 2;

export async function computeSuspiciousPairs(examId: string): Promise<SuspiciousPair[]> {
  const questions = await prisma.question.findMany({
    where: { examId, type: { in: ["MULTIPLE_CHOICE", "TRUE_FALSE"] } },
    include: { choices: true },
  });
  if (questions.length === 0) return [];
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const attempts = await prisma.examAttempt.findMany({
    where: { examId, status: { not: "IN_PROGRESS" } },
    include: {
      answers: { where: { questionId: { in: questions.map((q) => q.id) } } },
    },
  });
  if (attempts.length < 2) return [];

  // Per attempt: questionId -> chosen choiceId, restricted to answers that
  // were actually wrong (right answers are excluded from the comparison
  // entirely, not just from the count).
  const wrongChoiceByAttempt = new Map<string, Map<string, string>>();
  const answeredCountByAttempt = new Map<string, number>();
  for (const attempt of attempts) {
    const map = new Map<string, string>();
    let answered = 0;
    for (const answer of attempt.answers) {
      if (!answer.selectedChoiceId) continue;
      answered += 1;
      const question = questionById.get(answer.questionId);
      const choice = question?.choices.find((c) => c.id === answer.selectedChoiceId);
      if (choice && !choice.isCorrect) {
        map.set(answer.questionId, answer.selectedChoiceId);
      }
    }
    wrongChoiceByAttempt.set(attempt.id, map);
    answeredCountByAttempt.set(attempt.id, answered);
  }

  const pairs: SuspiciousPair[] = [];
  for (let i = 0; i < attempts.length; i++) {
    for (let j = i + 1; j < attempts.length; j++) {
      const a = attempts[i];
      const b = attempts[j];
      const wrongA = wrongChoiceByAttempt.get(a.id)!;
      const wrongB = wrongChoiceByAttempt.get(b.id)!;

      const sharedWrongQuestions: string[] = [];
      for (const [questionId, choiceId] of wrongA) {
        if (wrongB.get(questionId) === choiceId) {
          sharedWrongQuestions.push(questionById.get(questionId)!.text);
        }
      }
      if (sharedWrongQuestions.length < MIN_SHARED_WRONG) continue;

      const totalCommonQuestions = Math.min(
        answeredCountByAttempt.get(a.id) ?? 0,
        answeredCountByAttempt.get(b.id) ?? 0
      );

      pairs.push({
        attemptAId: a.id,
        studentA: a.studentName,
        attemptBId: b.id,
        studentB: b.studentName,
        sharedWrongCount: sharedWrongQuestions.length,
        totalCommonQuestions,
        sharedWrongQuestions,
      });
    }
  }

  pairs.sort((x, y) => y.sharedWrongCount - x.sharedWrongCount);
  return pairs;
}
