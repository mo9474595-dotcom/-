"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

type Student = { id: string; fullName: string; studentRef: string | null };

function CheckinForm() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";

  const [code, setCode] = useState(initialCode);
  const [phase, setPhase] = useState<"code" | "pick" | "done" | "error">("code");
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/attendance/checkin/${encodeURIComponent(code.trim().toUpperCase())}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر التحقق من الرمز");
      setPhase("error");
      return;
    }
    setClassName(data.className);
    setSessionTitle(data.session.title);
    setStudents(data.students);
    setPhase("pick");
  }

  useEffect(() => {
    if (!initialCode) return;
    fetch(`/api/attendance/checkin/${encodeURIComponent(initialCode.trim().toUpperCase())}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "تعذر التحقق من الرمز");
          setPhase("error");
          return;
        }
        setClassName(data.className);
        setSessionTitle(data.session.title);
        setStudents(data.students);
        setPhase("pick");
      })
      .catch(() => {
        setError("تعذر الاتصال بالخادم");
        setPhase("error");
      });
  }, [initialCode]);

  async function checkin(studentProfileId: string) {
    setLoading(true);
    const res = await fetch("/api/attendance/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase(), studentProfileId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر تسجيل الحضور");
      setPhase("error");
      return;
    }
    setResultMessage(
      data.alreadyMarked ? "تم تسجيل حضورك مسبقاً لهذه الجلسة" : "تم تسجيل حضورك بنجاح"
    );
    setPhase("done");
  }

  const filtered = students.filter(
    (s) =>
      s.fullName.includes(query) || (s.studentRef ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue dark:bg-slate-700 dark:text-blue-300">
          <Icon name="calendarCheck" size={22} />
        </div>
        <h1 className="text-center text-xl font-bold text-brand-navy-dark dark:text-slate-100">تسجيل الحضور</h1>

        {phase === "code" || phase === "error" ? (
          <form onSubmit={loadCode} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رمز الحضور</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="XXXXXX"
                className="rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
            >
              {loading ? "جارٍ التحقق..." : "التالي"}
            </button>
          </form>
        ) : phase === "pick" ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {className}
              {sessionTitle && ` — ${sessionTitle}`}
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن اسمك..."
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
            />
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => checkin(s.id)}
                  disabled={loading}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-right text-sm last:border-0 hover:bg-brand-panel disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {s.fullName}
                  {s.studentRef && (
                    <span className="text-xs text-slate-400 dark:text-slate-500"> · {s.studentRef}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد نتائج</p>
              )}
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-6 text-center dark:bg-green-950/40">
            <p className="font-semibold text-green-800 dark:text-green-300">{resultMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense>
      <CheckinForm />
    </Suspense>
  );
}
