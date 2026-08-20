import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

const statusLabels: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "قيد الحل", className: "bg-blue-100 text-blue-700" },
  SUBMITTED: { label: "تم التسليم", className: "bg-green-100 text-green-700" },
  AUTO_SUBMITTED: { label: "تسليم تلقائي", className: "bg-amber-100 text-amber-700" },
  TERMINATED: { label: "أُنهي (مخالفات)", className: "bg-red-100 text-red-700" },
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId) notFound();

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
      <h1 className="text-2xl font-bold text-slate-900">النتائج — {exam.title}</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-4 py-3 font-medium">الطالب</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">الدرجة</th>
              <th className="px-4 py-3 font-medium">مخالفات</th>
              <th className="px-4 py-3 font-medium">تحتاج تصحيح يدوي</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => {
              const status = statusLabels[a.status];
              const ungraded = a.answers.filter((ans) => ans.pointsAwarded == null).length;
              return (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.studentName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.score != null ? `${a.score} / ${a.maxScore}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a._count.cheatLogs > 0 ? (
                      <span className="font-medium text-red-600">{a._count.cheatLogs}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ungraded > 0 ? (
                      <span className="font-medium text-amber-600">{ungraded} سؤال</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/exams/${examId}/results/${a.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      عرض التفاصيل
                    </Link>
                  </td>
                </tr>
              );
            })}
            {attempts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  لا توجد محاولات بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
