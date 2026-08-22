import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherIdFromSession } from "@/lib/auth";
import PrintButton from "./PrintButton";

const ARABIC_CHOICE_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

export default async function ExamPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ answers?: string }>;
}) {
  const teacherId = await getTeacherIdFromSession();
  if (!teacherId) redirect("/teacher/login");

  const { examId } = await params;
  const { answers } = await searchParams;
  const withAnswers = answers === "1";

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: { orderBy: { order: "asc" }, include: { choices: { orderBy: { order: "asc" } } } },
    },
  });
  if (!exam || exam.teacherId !== teacherId || exam.deletedAt) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-slate-900" dir="rtl">
      <div className="no-print mb-6 flex items-center justify-between gap-3 rounded-xl bg-slate-100 p-4">
        <p className="text-sm text-slate-600">
          {withAnswers
            ? "نسخة تحتوي الإجابات الصحيحة — للأستاذ فقط، لا تُوزَّع على الطلاب."
            : "نسخة فارغة للطباعة وتوزيعها على الطلاب."}
        </p>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/teacher/print/${examId}${withAnswers ? "" : "?answers=1"}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {withAnswers ? "عرض النسخة الفارغة" : "عرض نسخة الإجابات"}
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="mb-8 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        {exam.description && <p className="mt-1 text-sm text-slate-600">{exam.description}</p>}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>المدة: {exam.durationMinutes} دقيقة</span>
          <span>عدد الأسئلة: {exam.questions.length}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <p>الاسم: ____________________</p>
          <p>الرقم الجامعي / الصف: ____________________</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="break-inside-avoid">
            <p className="font-semibold">
              {i + 1}. {q.text}
              <span className="mr-2 text-xs font-normal text-slate-500">({q.points} درجة)</span>
            </p>

            {q.type !== "SHORT_ANSWER" ? (
              <div className="mt-2 flex flex-col gap-1.5 pr-4">
                {q.choices.map((c, ci) => {
                  const isCorrect = withAnswers && c.isCorrect;
                  return (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isCorrect ? "border-green-600 bg-green-600" : "border-slate-400"
                        }`}
                      >
                        {isCorrect && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className={isCorrect ? "font-semibold text-green-700" : ""}>
                        {ARABIC_CHOICE_LETTERS[ci] ?? ci + 1}
                        {". "}
                        {c.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-3 pr-4">
                <div className="h-6 border-b border-dotted border-slate-400" />
                <div className="h-6 border-b border-dotted border-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
