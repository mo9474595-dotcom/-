"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";

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
    <div className="flex flex-1 flex-col">
      <AppHeader title="دخول الطالب للامتحان" icon={<Icon name="graduationCap" size={18} />} />

      <div className="relative flex flex-1 items-center justify-center gap-6 overflow-hidden bg-brand-page-tint px-4 py-16">
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />
        <div className="brand-ring pointer-events-none absolute -bottom-20 -left-10 hidden h-56 w-56 border-brand-blue/20 sm:block" />

        <div className="relative hidden shrink-0 self-stretch overflow-hidden rounded-2xl shadow-lg lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/photos/exam-hand.jpg"
            alt=""
            className="h-full w-64 object-cover"
          />
        </div>

        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-center text-2xl font-bold text-brand-navy-dark">الدخول إلى الامتحان</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            أدخل رمز الامتحان الذي أعطاك إياه الأستاذ واسمك الكامل للشروع بالامتحان.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                رمز الامتحان
                <Icon name="key" size={14} className="text-brand-blue" />
              </label>
              <input
                name="code"
                required
                placeholder="XXXX-XXXX-XXXX"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-center font-mono text-lg tracking-wider outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                الاسم الكامل
                <Icon name="user" size={14} className="text-brand-blue" />
              </label>
              <input
                name="studentName"
                required
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                الرقم الجامعي / رقم الجلوس (اختياري)
              </label>
              <input
                name="studentRef"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
            >
              {loading ? "جارٍ الدخول..." : "التالي"}
              <span>←</span>
            </button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Icon name="lock" size={12} />
            بياناتك آمنة وتُستخدم لأغراض الامتحان فقط
          </p>
        </div>
      </div>
    </div>
  );
}
