"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

const messages: Record<
  string,
  { title: string; body: string; tone: string; iconBg: string; icon: "check" | "clock" | "shield" }
> = {
  SUBMITTED: {
    title: "تم تسليم الامتحان بنجاح",
    body: "تم استلام إجاباتك بنجاح. يمكنك إغلاق هذه الصفحة الآن.",
    tone: "text-green-700 dark:text-green-400",
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
    icon: "check",
  },
  AUTO_SUBMITTED: {
    title: "انتهى الوقت المخصص للامتحان",
    body: "تم تسليم إجاباتك تلقائياً لأن الوقت انتهى.",
    tone: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    icon: "clock",
  },
  TERMINATED: {
    title: "تم إنهاء المحاولة",
    body: "تم إنهاء الامتحان بسبب تجاوز عدد المخالفات المسموح به. تم إبلاغ الأستاذ بالتفاصيل.",
    tone: "text-red-700 dark:text-red-400",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
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
    <div className="relative flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        {status === "SUBMITTED" || status == null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/brand/illustrations/success-check.png"
            alt=""
            className="mx-auto mb-2 h-24 w-auto"
          />
        ) : (
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${info.iconBg}`}>
            <Icon name={info.icon} size={28} />
          </div>
        )}
        <h1 className={`text-xl font-bold ${info.tone}`}>{info.title}</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{info.body}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/exam/${attemptId}/receipt`}
            className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy"
          >
            تحميل إيصال الامتحان
          </Link>
          {status !== "TERMINATED" && (
            <Link
              href={`/exam/${attemptId}/review`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              عرض تفصيل النتيجة
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
