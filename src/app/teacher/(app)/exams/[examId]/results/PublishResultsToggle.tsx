"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function PublishResultsToggle({
  examId,
  initialPublished,
  initialPublishAt,
}: {
  examId: string;
  initialPublished: boolean;
  initialPublishAt: Date | null;
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);
  const [publishAt, setPublishAt] = useState(toLocalInputValue(initialPublishAt));
  const [savingSchedule, setSavingSchedule] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // Toggling manually cancels any pending scheduled publish — it's
      // already resolved one way or the other.
      body: JSON.stringify({ resultsPublished: !published, resultsPublishAt: null }),
    });
    setLoading(false);
    if (res.ok) {
      setPublished(!published);
      setPublishAt("");
      toast(!published ? "تم نشر تفاصيل النتيجة للطلاب" : "تم إخفاء تفاصيل النتيجة عن الطلاب", "success");
      router.refresh();
    } else {
      toast("تعذر تحديث حالة نشر النتائج", "error");
    }
  }

  async function saveSchedule() {
    setSavingSchedule(true);
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsPublishAt: publishAt ? new Date(publishAt).toISOString() : null }),
    });
    setSavingSchedule(false);
    if (res.ok) {
      toast(publishAt ? "تم جدولة نشر النتائج" : "تم إلغاء الجدولة", "success");
      router.refresh();
    } else {
      toast("تعذر حفظ الجدولة", "error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
          published
            ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
            : "bg-brand-blue text-white hover:bg-brand-navy"
        }`}
      >
        <Icon name={published ? "shield" : "check"} size={14} />
        {loading
          ? "جارٍ الحفظ..."
          : published
          ? "إخفاء تفاصيل النتيجة عن الطلاب"
          : "نشر تفاصيل النتيجة للطلاب"}
      </button>

      {!published && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>أو جدولة النشر تلقائياً في:</span>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="rounded-lg border border-slate-300 px-2 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {savingSchedule ? "..." : "حفظ"}
          </button>
        </div>
      )}
    </div>
  );
}
