"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClassSection } from "@prisma/client";
import Icon from "@/components/brand/Icon";

export default function WeightsEditor({ classSection }: { classSection: ClassSection }) {
  const router = useRouter();
  const [weights, setWeights] = useState({
    examWeight: classSection.examWeight,
    manualGradeWeight: classSection.manualGradeWeight,
    projectWeight: classSection.projectWeight,
    attendanceWeight: classSection.attendanceWeight,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total =
    weights.examWeight + weights.manualGradeWeight + weights.projectWeight + weights.attendanceWeight;

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/teacher/classes/${classSection.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weights),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const fields: { key: keyof typeof weights; label: string }[] = [
    { key: "examWeight", label: "الامتحانات" },
    { key: "manualGradeWeight", label: "درجات أخرى" },
    { key: "projectWeight", label: "المشاريع" },
    { key: "attendanceWeight", label: "الحضور" },
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon name="scale" size={17} className="text-brand-blue" />
        أوزان حساب الترتيب العام
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        لا يشترط أن يكون المجموع 100 — إذا لم يكن للطالب بيانات في أحد البنود يُعاد توزيع
        وزنه تلقائياً على البنود المتوفرة له.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs text-slate-600">{f.label} (٪)</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={weights[f.key]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [f.key]: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pl-6 text-sm"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                %
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className={`text-xs ${total === 100 ? "text-slate-500" : "text-amber-600"}`}>
          المجموع الحالي: {total}٪{total !== 100 && " (سيُطبَّع تلقائياً)"}
        </span>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          <Icon name="save" size={15} />
          {saving ? "جارٍ الحفظ..." : "حفظ الأوزان"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-700">
            <Icon name="check" size={13} /> تم الحفظ
          </span>
        )}
      </div>
    </div>
  );
}
