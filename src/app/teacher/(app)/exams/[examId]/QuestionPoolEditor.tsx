"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

export default function QuestionPoolEditor({
  examId,
  totalQuestions,
  initialPoolSize,
}: {
  examId: string;
  totalQuestions: number;
  initialPoolSize: number | null;
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [poolSize, setPoolSize] = useState(initialPoolSize ? String(initialPoolSize) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionPoolSize: poolSize ? Number(poolSize) : null }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "تعذر حفظ الإعداد");
      return;
    }
    toast(poolSize ? "تم تفعيل مجموعة الأسئلة العشوائية" : "تم إلغاء مجموعة الأسئلة العشوائية", "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon name="shield" size={17} className="text-brand-blue" />
        مجموعة أسئلة عشوائية (اختياري)
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        إذا حددت عدداً أقل من إجمالي أسئلة الامتحان ({totalQuestions})، سيُسحب هذا العدد عشوائياً
        من كل الأسئلة لكل طالب — فيحصل طلاب مختلفون على أسئلة مختلفة فعلياً، وليس فقط بترتيب
        مختلف. اتركه فارغاً ليرى الجميع كل الأسئلة كالمعتاد.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={Math.max(1, totalQuestions - 1)}
          value={poolSize}
          onChange={(e) => setPoolSize(e.target.value)}
          placeholder={`مثال: ${Math.max(1, Math.ceil(totalQuestions / 2))}`}
          className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="text-xs text-slate-500">سؤال لكل طالب (من أصل {totalQuestions})</span>
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
      >
        <Icon name="save" size={14} />
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}
