"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";

export default function ResetAttemptButton({
  examId,
  attemptId,
  studentName,
}: {
  examId: string;
  attemptId: string;
  studentName: string;
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    const ok = await confirm({
      title: `إعادة تعيين محاولة ${studentName}؟`,
      body: "سيُحذف كل ما أنجزه الطالب في هذه المحاولة (إجاباته ودرجته وسجل مخالفاته) نهائياً، ويعود رمز الامتحان قابلاً للاستخدام من جديد. استخدم هذا فقط إذا تعطل جهاز الطالب أو عَلِق بدون سبب مشروع لعدم إكمال المحاولة.",
      confirmLabel: "إعادة تعيين نهائياً",
      danger: true,
    });
    if (!ok) return;

    setLoading(true);
    const res = await fetch(`/api/teacher/attempts/${attemptId}/reset`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast("تمت إعادة تعيين المحاولة، الرمز جاهز للاستخدام من جديد", "success");
      router.push(`/teacher/exams/${examId}/results`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast(data?.error ?? "تعذر إعادة تعيين المحاولة", "error");
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "جارٍ إعادة التعيين..." : "إعادة تعيين المحاولة"}
    </button>
  );
}
