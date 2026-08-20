"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamCode, ExamAttempt } from "@prisma/client";
import ScoreFraction from "@/components/ScoreFraction";
import { usePagedSearch } from "@/components/ui/usePagedSearch";
import PaginationBar from "@/components/ui/PaginationBar";

type CodeRow = ExamCode & {
  attempt: Pick<ExamAttempt, "status" | "score" | "maxScore"> | null;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: "قيد الحل", className: "bg-blue-100 text-blue-700" },
  SUBMITTED: { label: "تم التسليم", className: "bg-green-100 text-green-700" },
  AUTO_SUBMITTED: { label: "تسليم تلقائي (انتهى الوقت)", className: "bg-amber-100 text-amber-700" },
  TERMINATED: { label: "أُنهي (مخالفات)", className: "bg-red-100 text-red-700" },
};

export default function CodesClient({
  examId,
  initialCodes,
  classes,
}: {
  examId: string;
  initialCodes: CodeRow[];
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [codes, setCodes] = useState(initialCodes);
  const [count, setCount] = useState(10);
  const [namesText, setNamesText] = useState("");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const studentNames = namesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    const body = classId
      ? { fromClassId: classId }
      : studentNames.length > 0
      ? { studentNames }
      : { count };

    const res = await fetch(`/api/teacher/exams/${examId}/codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر إنشاء الرموز");
      return;
    }
    setCodes((prev) => [...data.codes.map((c: ExamCode) => ({ ...c, attempt: null })), ...prev]);
    setNamesText("");
    router.refresh();
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }

  const { query, setQuery, page, setPage, pageCount, pageItems, totalCount, pageSize } =
    usePagedSearch(codes, (c, q) => c.code.toLowerCase().includes(q) || (c.studentName ?? "").toLowerCase().includes(q));

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form
        onSubmit={handleGenerate}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-semibold text-slate-900">إنشاء رموز جديدة</h2>

        {classes.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              توليد لكل طلاب شعبة (يربط النتيجة تلقائياً بسجل كل طالب)
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— بدون شعبة —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!classId && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                عدد الرموز بدون أسماء
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                أو أدخل أسماء الطلاب (اسم في كل سطر) لإنشاء رمز مخصص لكل واحد
              </label>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                rows={4}
                placeholder={"أحمد محمد\nسارة علي\n..."}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الإنشاء..." : "إنشاء الرموز"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالرمز أو اسم الطالب..."
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="shrink-0 text-xs text-slate-500">{codes.length} رمز إجمالاً</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-4 py-3 font-medium">الرمز</th>
              <th className="px-4 py-3 font-medium">الطالب</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">الدرجة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => {
              const status = c.attempt ? statusLabels[c.attempt.status] : null;
              return (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{c.code}</td>
                  <td className="px-4 py-3 text-slate-600">{c.studentName || "—"}</td>
                  <td className="px-4 py-3">
                    {status ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        لم يُستخدم
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <ScoreFraction score={c.attempt?.score} max={c.attempt?.maxScore} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyCode(c.code)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {copiedCode === c.code ? "تم النسخ ✓" : "نسخ"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {codes.length === 0 ? "لا توجد رموز بعد." : "لا توجد نتائج مطابقة."}
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
