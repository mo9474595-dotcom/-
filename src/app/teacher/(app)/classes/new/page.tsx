"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

export default function NewClassPage() {
  const router = useRouter();
  const { confirm } = useUI();
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

    let res = await fetch("/api/teacher/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data = await res.json();

    if (!res.ok && data.code === "DUPLICATE_NAME") {
      const proceed = await confirm({
        title: "اسم مكرر",
        body: `${data.error}. هل تريد إنشاء شعبة أخرى بنفس الاسم على أي حال؟`,
        confirmLabel: "إنشاء على أي حال",
      });
      if (!proceed) {
        setLoading(false);
        return;
      }
      res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, force: true }),
      });
      data = await res.json();
    }

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ ما");
      setLoading(false);
      return;
    }
    router.push(`/teacher/classes/${data.classSection.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-brand-navy-dark">شعبة جديدة</h1>
      <p className="mt-1 text-sm text-slate-500">إنشاء شعبة جديدة وإضافة درجات أعمال الفصل</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">اسم الشعبة</label>
          <div className="relative">
            <input
              name="name"
              required
              placeholder="مثال: الصف الأول أ"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pl-10 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue">
              <Icon name="users" size={17} />
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            أوزان حساب الترتيب العام للطالب (٪) — يمكن تعديلها لاحقاً
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "examWeight", label: "الامتحانات", def: 50 },
              { name: "manualGradeWeight", label: "واجبات أخرى", def: 20 },
              { name: "projectWeight", label: "المشاريع", def: 20 },
              { name: "attendanceWeight", label: "الحضور", def: 10 },
            ].map((f) => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">{f.label}</label>
                <div className="relative">
                  <input
                    name={f.name}
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={f.def}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 pl-6 text-sm"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
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
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          <span>+</span>
          {loading ? "جارٍ الإنشاء..." : "إنشاء الشعبة"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-brand-panel px-6 py-5">
        <div className="text-right">
          <p className="flex items-center justify-end gap-2 font-bold text-brand-navy-dark">
            نصيحة
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-blue">
              <Icon name="bulb" size={16} />
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            أنت تتحكم في توزيع الأوزان بما يتناسب مع طريقة التقييم في مؤسستك.
          </p>
        </div>
      </div>
    </div>
  );
}
