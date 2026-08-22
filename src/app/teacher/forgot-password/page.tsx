"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/teacher/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ ما");
        setLoading(false);
        return;
      }
      setMessage(data.message);
      setLoading(false);
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="نسيت كلمة المرور" icon={<Icon name="key" size={18} />} />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-page-tint px-4 py-16">
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />

        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
            <Icon name="key" size={24} />
          </div>
          <h1 className="text-center text-2xl font-bold text-brand-navy-dark">نسيت كلمة المرور؟</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.
          </p>

          {message ? (
            <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-center text-sm text-emerald-800">
              {message}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
              >
                {loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            تذكرت كلمة المرور؟{" "}
            <Link href="/teacher/login" className="font-medium text-brand-blue hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
