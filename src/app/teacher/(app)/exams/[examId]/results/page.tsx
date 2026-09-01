import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ResultsTableClient from "./ResultsTableClient";
import PublishResultsToggle from "./PublishResultsToggle";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId || exam.deletedAt) notFound();

  const attempts = await prisma.examAttempt.findMany({
    where: { examId },
    orderBy: { startedAt: "desc" },
    include: {
      _count: { select: { cheatLogs: true } },
      answers: {
        where: { question: { type: "SHORT_ANSWER" } },
        select: { pointsAwarded: true },
      },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-dark">النتائج — {exam.title}</h1>
          <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
        </div>
        <PublishResultsToggle
          examId={examId}
          initialPublished={exam.resultsPublished}
          initialPublishAt={exam.resultsPublishAt}
        />
      </div>
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        عند نشر تفاصيل النتيجة، يمكن للطلاب الاطلاع على إجاباتهم مقابل الإجابات الصحيحة لكل
        سؤال. يُفضَّل نشرها بعد الانتهاء من تصحيح الأسئلة ذات الإجابة القصيرة يدوياً.
      </p>
      <ResultsTableClient examId={examId} attempts={attempts} />
    </div>
  );
}
