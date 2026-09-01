import type { AttemptReview } from "@/lib/exam-review";
import ScoreFraction from "@/components/ScoreFraction";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح أو خطأ",
  SHORT_ANSWER: "إجابة قصيرة",
};

export default function ExamReviewView({ data }: { data: AttemptReview }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-800">
        <h1 className="text-xl font-bold text-brand-navy-dark dark:text-slate-100">{data.examTitle}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          مراجعة تفصيلية للنتيجة — {data.studentName}
        </p>
        <p className="mt-3 text-2xl font-bold text-brand-blue dark:text-blue-400">
          <ScoreFraction score={data.score} max={data.maxScore} />
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {data.questions.map((q, i) => {
          const isShortAnswer = q.type === "SHORT_ANSWER";
          const graded = q.pointsAwarded != null;
          return (
            <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {i + 1}. {q.text}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {typeLabels[q.type]}
                </span>
              </div>

              {q.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
                <img
                  src={q.imageUrl}
                  alt="صورة السؤال"
                  className="mt-3 max-h-72 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                />
              )}

              {!isShortAnswer ? (
                <div className="mt-3 flex flex-col gap-1.5 text-sm">
                  {q.choices.map((c) => {
                    const chosen = c.id === q.selectedChoiceId;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                          c.isCorrect
                            ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300"
                            : chosen
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {c.isCorrect ? (
                          <Icon name="check" size={14} className="shrink-0 text-green-600 dark:text-green-400" />
                        ) : chosen ? (
                          <span className="shrink-0 text-red-600 dark:text-red-400">✕</span>
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{c.text}</span>
                        {chosen && !c.isCorrect && (
                          <span className="mr-auto text-xs text-red-600 dark:text-red-400">إجابتك</span>
                        )}
                      </div>
                    );
                  })}
                  {!q.selectedChoiceId && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">لم تُجب على هذا السؤال</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-700/40">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">إجابتك</p>
                    <p className="mt-0.5 text-slate-800 dark:text-slate-200">
                      {q.textAnswer?.trim() ? q.textAnswer : "— لم تُجب —"}
                    </p>
                  </div>
                  {q.correctAnswer && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-700 dark:bg-green-950/40">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300">إجابة نموذجية</p>
                      <p className="mt-0.5 text-green-800 dark:text-green-200">{q.correctAnswer}</p>
                    </div>
                  )}
                  {q.feedback && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">ملاحظة الأستاذ</p>
                      <p className="mt-0.5 text-blue-800 dark:text-blue-200">{q.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {graded ? (
                  <>
                    الدرجة: <span className="font-medium text-slate-700 dark:text-slate-300">{q.pointsAwarded}</span> من{" "}
                    {q.points}
                  </>
                ) : (
                  "بانتظار التصحيح اليدوي"
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
