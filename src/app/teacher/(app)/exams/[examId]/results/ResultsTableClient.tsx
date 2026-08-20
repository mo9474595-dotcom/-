"use client";

import Link from "next/link";
import ScoreFraction from "@/components/ScoreFraction";
import { usePagedSearch } from "@/components/ui/usePagedSearch";
import PaginationBar from "@/components/ui/PaginationBar";

type Attempt = {
  id: string;
  studentName: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  _count: { cheatLogs: number };
  answers: { pointsAwarded: number | null }[];
};

const statusLabels: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "قيد الحل", className: "bg-blue-100 text-blue-700" },
  SUBMITTED: { label: "تم التسليم", className: "bg-green-100 text-green-700" },
  AUTO_SUBMITTED: { label: "تسليم تلقائي", className: "bg-amber-100 text-amber-700" },
  TERMINATED: { label: "أُنهي (مخالفات)", className: "bg-red-100 text-red-700" },
};

export default function ResultsTableClient({
  examId,
  attempts,
}: {
  examId: string;
  attempts: Attempt[];
}) {
  const { query, setQuery, page, setPage, pageCount, pageItems, totalCount, pageSize } =
    usePagedSearch(attempts, (a, q) => a.studentName.toLowerCase().includes(q));

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الطالب..."
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="shrink-0 text-xs text-slate-500">{attempts.length} محاولة إجمالاً</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
            {pageItems.map((a) => {
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
                    <ScoreFraction score={a.score} max={a.maxScore} />
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
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {attempts.length === 0 ? "لا توجد محاولات بعد." : "لا توجد نتائج مطابقة."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationBar
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
