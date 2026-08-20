"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/brand/AppHeader";

type Field = {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  minLength?: number;
  icon?: React.ReactNode;
};

export default function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  endpoint,
  redirectTo,
  footer,
  headerIcon,
  formIcon,
}: {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  endpoint: string;
  redirectTo: string;
  footer?: React.ReactNode;
  headerIcon?: React.ReactNode;
  formIcon?: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(endpoint, {
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
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title={title} icon={headerIcon} />

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-page-tint px-4 py-16"
        style={{
          backgroundImage: "url(/brand/auth-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      >
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />
        <div className="brand-ring pointer-events-none absolute -bottom-20 -left-10 hidden h-56 w-56 border-brand-blue/20 sm:block" />

        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          {formIcon ? (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
              {formIcon}
            </div>
          ) : null}
          <h1 className="text-center text-2xl font-bold text-brand-navy-dark">{title}</h1>
          <p className="mt-1 text-center text-sm text-slate-500">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.name} className="flex flex-col gap-1">
                <label htmlFor={f.name} className="text-sm font-medium text-slate-700">
                  {f.label}
                </label>
                <div className="relative">
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    required
                    minLength={f.minLength}
                    autoComplete={f.autoComplete}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
                  />
                  {f.icon ? (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {f.icon}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
            >
              {loading ? "جارٍ التنفيذ..." : submitLabel}
            </button>
          </form>

          {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
