"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewExamPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      durationMinutes: formData.get("durationMinutes"),
      maxTabViolations: formData.get("maxTabViolations"),
      shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleChoices: formData.get("shuffleChoices") === "on",
    };

    const res = await fetch("/api/teacher/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "حدث خطأ ما");
      setLoading(false);
      return;
    }
    router.push(`/teacher/exams/${data.exam.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">امتحان جديد</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">عنوان الامتحان</label>
          <input
            name="title"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">وصف (اختياري)</label>
          <textarea
            name="description"
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">المدة (بالدقائق)</label>
            <input
              name="durationMinutes"
              type="number"
              min={1}
              max={600}
              defaultValue={30}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              الحد الأقصى لمحاولات الخروج من الصفحة
            </label>
            <input
              name="maxTabViolations"
              type="number"
              min={0}
              max={20}
              defaultValue={3}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="shuffleQuestions" defaultChecked className="rounded" />
          ترتيب عشوائي للأسئلة لكل طالب
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="shuffleChoices" defaultChecked className="rounded" />
          ترتيب عشوائي للخيارات لكل طالب
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الإنشاء..." : "إنشاء الامتحان"}
        </button>
      </form>
    </div>
  );
}
