"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

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
      <AppHeader
        title="دخول الطالب للامتحان"
        icon={<Icon name="graduationCap" size={18} />}
        rightExtra={<ThemeToggle />}
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />
        <div className="brand-ring pointer-events-none absolute -bottom-20 -left-10 hidden h-56 w-56 border-brand-blue/20 sm:block" />

        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue dark:bg-slate-700 dark:text-blue-300">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-center text-2xl font-bold text-brand-navy-dark dark:text-slate-100">الدخول إلى الامتحان</h1>
          <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
            أدخل رمز الامتحان الذي أعطاك إياه الأستاذ واسمك الكامل للشروع بالامتحان.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                رمز الامتحان
                <Icon name="key" size={14} className="text-brand-blue dark:text-blue-400" />
              </label>
              <input
                name="code"
                required
                placeholder="XXXX-XXXX-XXXX"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-center font-mono text-lg tracking-wider outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-900/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                الاسم الكامل
                <Icon name="user" size={14} className="text-brand-blue dark:text-blue-400" />
              </label>
              <input
                name="studentName"
                required
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                الرقم الجامعي / رقم الجلوس (اختياري)
              </label>
              <input
                name="studentRef"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
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

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
            <Icon name="lock" size={12} />
            بياناتك آمنة وتُستخدم لأغراض الامتحان فقط
          </p>
          <Link
            href="/exam/device-check"
            className="mt-2 block text-center text-xs font-medium text-brand-blue hover:underline dark:text-blue-400"
          >
            لست متأكداً أن جهازك جاهز؟ جرّب صفحة تجربة الجهاز أولاً
          </Link>
        </div>
      </div>
    </div>
  );
}
