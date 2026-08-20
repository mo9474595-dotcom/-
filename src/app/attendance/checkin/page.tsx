"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">تسجيل الحضور</h1>

        {phase === "code" || phase === "error" ? (
          <form onSubmit={loadCode} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">رمز الحضور</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="XXXXXX"
                className="rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "جارٍ التحقق..." : "التالي"}
            </button>
          </form>
        ) : phase === "pick" ? (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              {className}
              {sessionTitle && ` — ${sessionTitle}`}
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن اسمك..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => checkin(s.id)}
                  disabled={loading}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-right text-sm last:border-0 hover:bg-blue-50 disabled:opacity-60"
                >
                  {s.fullName}
                  {s.studentRef && (
                    <span className="text-xs text-slate-400"> · {s.studentRef}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-slate-500">لا توجد نتائج</p>
              )}
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-6 text-center">
            <p className="font-semibold text-green-800">{resultMessage}</p>
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
