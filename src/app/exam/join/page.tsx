"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function JoinExamPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      code: formData.get("code"),
      studentName: formData.get("studentName"),
      studentRef: formData.get("studentRef"),
    };

    try {
      const res = await fetch("/api/exam/join", {
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
      router.push(`/exam/${data.attemptId}`);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">الدخول إلى الامتحان</h1>
        <p className="mt-1 text-sm text-slate-500">
          أدخل رمز الامتحان الذي أعطاك إياه الأستاذ واسمك الكامل.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">رمز الامتحان</label>
            <input
              name="code"
              required
              placeholder="XXXX-XXXX-XXXX"
              className="rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">الاسم الكامل</label>
            <input
              name="studentName"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              الرقم الجامعي / رقم الجلوس (اختياري)
            </label>
            <input
              name="studentRef"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "جارٍ الدخول..." : "التالي"}
          </button>
        </form>
      </div>
    </div>
  );
}
