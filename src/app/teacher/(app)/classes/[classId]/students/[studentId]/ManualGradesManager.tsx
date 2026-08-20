"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ManualGrade } from "@prisma/client";
import ScoreFraction from "@/components/ScoreFraction";

export default function ManualGradesManager({
  studentId,
  initialGrades,
}: {
  studentId: string;
  initialGrades: ManualGrade[];
}) {
  const router = useRouter();
  const [grades, setGrades] = useState(initialGrades);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      score: formData.get("score"),
      maxScore: formData.get("maxScore"),
      notes: formData.get("notes"),
    };

    const res = await fetch(`/api/teacher/students/${studentId}/manual-grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر إضافة الدرجة");
      return;
    }
    setGrades((prev) => [data.grade, ...prev]);
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(gradeId: string) {
    await fetch(`/api/teacher/manual-grades/${gradeId}`, { method: "DELETE" });
    setGrades((prev) => prev.filter((g) => g.id !== gradeId));
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">درجات أخرى (اختبارات قصيرة، واجبات...)</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            + إضافة درجة
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <label className="text-xs text-slate-600">العنوان</label>
            <input name="title" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">الدرجة</label>
            <input name="score" type="number" step="0.1" min={0} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">من</label>
            <input name="maxScore" type="number" step="0.1" min={0.1} required defaultValue={10} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">ملاحظات (اختياري)</label>
            <input name="notes" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {error && (
            <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="col-span-full flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "جارٍ الحفظ..." : "إضافة"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {grades.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">لا توجد درجات مضافة يدوياً بعد.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-3 py-2 font-medium">العنوان</th>
              <th className="px-3 py-2 font-medium">الدرجة</th>
              <th className="px-3 py-2 font-medium">ملاحظات</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">{g.title}</td>
                <td className="px-3 py-2 text-slate-600">
                  <ScoreFraction score={g.score} max={g.maxScore} />
                </td>
                <td className="px-3 py-2 text-slate-500">{g.notes || "—"}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
