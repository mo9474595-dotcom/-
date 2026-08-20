import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import GradeClient from "./GradeClient";
import ScoreFraction from "@/components/ScoreFraction";

const cheatLabels: Record<string, string> = {
  TAB_HIDDEN: "غادر التبويب / أخفاه",
  WINDOW_BLUR: "فقدت نافذة الامتحان التركيز",
  FULLSCREEN_EXIT: "خرج من وضع الشاشة الكاملة",
  COPY_ATTEMPT: "حاول نسخ محتوى",
  PASTE_ATTEMPT: "حاول لصق محتوى",
  CONTEXT_MENU: "فتح قائمة الزر الأيمن",
  DEVTOOLS_SUSPECTED: "اشتباه بفتح أدوات المطور",
  MULTIPLE_SESSION_BLOCKED: "محاولة دخول من جهاز آخر بنفس الرمز",
  SHORTCUT_BLOCKED: "استخدام اختصار لوحة مفاتيح محظور",
};

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId, attemptId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId) notFound();

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.examId !== examId) notFound();

  const [questions, answers, cheatLogs] = await Promise.all([
    prisma.question.findMany({
      where: { examId },
      include: { choices: true },
      orderBy: { order: "asc" },
    }),
    prisma.answer.findMany({ where: { attemptId } }),
    prisma.cheatLog.findMany({ where: { attemptId }, orderBy: { createdAt: "asc" } }),
  ]);

  const order: string[] = JSON.parse(attempt.questionOrder);
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a]));

  const items = order
    .map((qid) => questionById.get(qid))
    .filter((q): q is (typeof questions)[number] => Boolean(q))
    .map((q) => ({ question: q, answer: answerByQuestionId.get(q.id) ?? null }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{attempt.studentName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {exam.title} · الدرجة: <ScoreFraction score={attempt.score} max={attempt.maxScore} />
        </p>
      </div>

      {cheatLogs.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-800">سجل المخالفات ({cheatLogs.length})</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-red-700">
            {cheatLogs.map((log) => (
              <li key={log.id}>
                {new Date(log.createdAt).toLocaleTimeString("ar")} — {cheatLabels[log.type] ?? log.type}
              </li>
            ))}
          </ul>
        </div>
      )}

      <GradeClient attemptId={attemptId} items={items} />
    </div>
  );
}
