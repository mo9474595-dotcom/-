import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { computeSuspiciousPairs } from "@/lib/integrity";
import ResultsTableClient from "./ResultsTableClient";
import PublishResultsToggle from "./PublishResultsToggle";
import Icon from "@/components/brand/Icon";

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

  const suspiciousPairs = await computeSuspiciousPairs(examId);

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

      {suspiciousPairs.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Icon name="shield" size={17} className="text-red-600" />
            تحليل النزاهة الأكاديمية
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            أزواج طلاب اختاروا نفس الإجابة الخاطئة بالضبط في أكثر من سؤالين — تطابق الإجابات
            الصحيحة أمر طبيعي، لكن تكرار نفس الخطأ تحديداً بين طالبين مؤشر يستحق المراجعة اليدوية،
            وليس دليلاً قاطعاً على الغش.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {suspiciousPairs.map((pair, i) => (
              <div key={i} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-red-800">
                    {pair.studentA} ⇄ {pair.studentB}
                  </p>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {pair.sharedWrongCount} إجابة خاطئة مشتركة من {pair.totalCommonQuestions}
                  </span>
                </div>
                <ul className="mt-2 flex flex-col gap-0.5 text-xs text-red-700">
                  {pair.sharedWrongQuestions.map((q, qi) => (
                    <li key={qi}>• {q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
