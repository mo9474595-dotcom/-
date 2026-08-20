"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";

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
      <h1 className="text-2xl font-bold text-brand-navy-dark">امتحان جديد</h1>
      <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">عنوان الامتحان</label>
          <input
            name="title"
            required
            placeholder="اكتب عنوان الامتحان"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">وصف (اختياري)</label>
          <textarea
            name="description"
            rows={3}
            placeholder="اكتب وصفاً مختصراً عن الامتحان..."
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">المدة (بالدقائق)</label>
            <div className="relative">
              <input
                name="durationMinutes"
                type="number"
                min={1}
                max={600}
                defaultValue={30}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pl-9 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="clock" size={16} />
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              الحد الأقصى لمحاولات الخروج من الصفحة
            </label>
            <div className="relative">
              <input
                name="maxTabViolations"
                type="number"
                min={0}
                max={20}
                defaultValue={3}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pl-9 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="shield" size={16} />
              </span>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="shuffleQuestions" defaultChecked className="mt-0.5 h-4 w-4 rounded accent-brand-blue" />
          <span>
            ترتيب عشوائي للأسئلة لكل طالب
            <span className="block text-xs text-slate-400">يتم ترتيب الأسئلة بشكل مختلف لكل طالب</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="shuffleChoices" defaultChecked className="mt-0.5 h-4 w-4 rounded accent-brand-blue" />
          <span>
            ترتيب عشوائي للخيارات داخل الطلب
            <span className="block text-xs text-slate-400">يتم ترتيب خيارات الإجابة بشكل مختلف لكل طالب</span>
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          <span>+</span>
          {loading ? "جارٍ الإنشاء..." : "إنشاء الامتحان"}
        </button>
      </form>
    </div>
  );
}
