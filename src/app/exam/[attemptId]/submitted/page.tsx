"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Icon from "@/components/brand/Icon";

const messages: Record<
  string,
  { title: string; body: string; tone: string; iconBg: string; icon: "check" | "clock" | "shield" }
> = {
  SUBMITTED: {
    title: "تم تسليم الامتحان بنجاح",
    body: "تم استلام إجاباتك بنجاح. يمكنك إغلاق هذه الصفحة الآن.",
    tone: "text-green-700",
    iconBg: "bg-green-100 text-green-600",
    icon: "check",
  },
  AUTO_SUBMITTED: {
    title: "انتهى الوقت المخصص للامتحان",
    body: "تم تسليم إجاباتك تلقائياً لأن الوقت انتهى.",
    tone: "text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
    icon: "clock",
  },
  TERMINATED: {
    title: "تم إنهاء المحاولة",
    body: "تم إنهاء الامتحان بسبب تجاوز عدد المخالفات المسموح به. تم إبلاغ الأستاذ بالتفاصيل.",
    tone: "text-red-700",
    iconBg: "bg-red-100 text-red-600",
    icon: "shield",
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
    <div className="flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${info.iconBg}`}>
          <Icon name={info.icon} size={28} />
        </div>
        <h1 className={`text-xl font-bold ${info.tone}`}>{info.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{info.body}</p>
      </div>
    </div>
  );
}
