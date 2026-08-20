"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const messages: Record<string, { title: string; body: string; tone: string }> = {
  SUBMITTED: {
    title: "تم تسليم الامتحان بنجاح",
    body: "تم استلام إجاباتك بنجاح. يمكنك إغلاق هذه الصفحة الآن.",
    tone: "text-green-700",
  },
  AUTO_SUBMITTED: {
    title: "انتهى الوقت المخصص للامتحان",
    body: "تم تسليم إجاباتك تلقائياً لأن الوقت انتهى.",
    tone: "text-amber-700",
  },
  TERMINATED: {
    title: "تم إنهاء المحاولة",
    body: "تم إنهاء الامتحان بسبب تجاوز عدد المخالفات المسموح به. تم إبلاغ الأستاذ بالتفاصيل.",
    tone: "text-red-700",
  },
};

export default function SubmittedPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exam/${attemptId}/state`)
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? "SUBMITTED"))
      .catch(() => setStatus("SUBMITTED"));
  }, [attemptId]);

  const info = messages[status ?? "SUBMITTED"] ?? messages.SUBMITTED;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className={`text-xl font-bold ${info.tone}`}>{info.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{info.body}</p>
      </div>
    </div>
  );
}
