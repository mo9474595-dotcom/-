"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

export default function PublishResultsToggle({
  examId,
  initialPublished,
}: {
  examId: string;
  initialPublished: boolean;
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultsPublished: !published }),
    });
    setLoading(false);
    if (res.ok) {
      setPublished(!published);
      toast(!published ? "تم نشر تفاصيل النتيجة للطلاب" : "تم إخفاء تفاصيل النتيجة عن الطلاب", "success");
      router.refresh();
    } else {
      toast("تعذر تحديث حالة نشر النتائج", "error");
    }
  }

  return (
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
  );
}
