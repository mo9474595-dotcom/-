"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function NewClassPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      examWeight: formData.get("examWeight"),
      manualGradeWeight: formData.get("manualGradeWeight"),
      projectWeight: formData.get("projectWeight"),
      attendanceWeight: formData.get("attendanceWeight"),
    };

    const res = await fetch("/api/teacher/classes", {
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
    router.push(`/teacher/classes/${data.classSection.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">شعبة جديدة</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">اسم الشعبة</label>
          <input
            name="name"
            required
            placeholder="مثال: الصف الأول أ"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            أوزان حساب الترتيب العام للطالب (٪) — يمكن تعديلها لاحقاً
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "examWeight", label: "الامتحانات", def: 50 },
              { name: "manualGradeWeight", label: "درجات أخرى", def: 20 },
              { name: "projectWeight", label: "المشاريع", def: 20 },
              { name: "attendanceWeight", label: "الحضور", def: 10 },
            ].map((f) => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">{f.label}</label>
                <input
                  name={f.name}
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={f.def}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الإنشاء..." : "إنشاء الشعبة"}
        </button>
      </form>
    </div>
  );
}
