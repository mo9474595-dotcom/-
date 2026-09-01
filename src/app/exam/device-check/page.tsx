"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

type CheckStatus = "pending" | "pass" | "warn" | "fail";

type CheckResult = {
  label: string;
  status: CheckStatus;
  detail: string;
};

function statusStyles(status: CheckStatus) {
  switch (status) {
    case "pass":
      return { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", icon: "check" as const };
    case "warn":
      return { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", icon: "shield" as const };
    case "fail":
      return { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", icon: "shield" as const };
    default:
      return { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400", icon: "clock" as const };
  }
}

export default function DeviceCheckPage() {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);

  async function runChecks() {
    setRunning(true);
    const out: CheckResult[] = [];

    // 1. Fullscreen API support
    const fsSupported = Boolean(
      document.documentElement.requestFullscreen ||
        (document.documentElement as unknown as { webkitRequestFullscreen?: () => void })
          .webkitRequestFullscreen
    );
    if (fsSupported) {
      try {
        await document.documentElement.requestFullscreen();
        await new Promise((r) => setTimeout(r, 300));
        const entered = Boolean(document.fullscreenElement);
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        out.push(
          entered
            ? { label: "وضع الشاشة الكاملة", status: "pass", detail: "يعمل بشكل طبيعي على هذا الجهاز" }
            : {
                label: "وضع الشاشة الكاملة",
                status: "warn",
                detail: "المتصفح يدعمه نظرياً لكن لم يُفعَّل فعلياً — الامتحان سيعمل، لكن دون هذه الطبقة من الحماية",
              }
        );
      } catch {
        out.push({
          label: "وضع الشاشة الكاملة",
          status: "warn",
          detail: "تعذّر تفعيله الآن (قد يحتاج ضغطة مباشرة من المستخدم) — سيُطلب مرة أخرى عند بدء الامتحان الفعلي",
        });
      }
    } else {
      out.push({
        label: "وضع الشاشة الكاملة",
        status: "warn",
        detail:
          "هذا المتصفح/الجهاز (شائع على آيفون وآيباد) لا يدعم هذه الميزة — الامتحان يعمل بشكل طبيعي، فقط دون هذه الطبقة الإضافية من المراقبة",
      });
    }

    // 2. Cookies / storage enabled (needed for session + rate-limit id)
    let cookiesOk = false;
    try {
      document.cookie = "device_check_test=1; path=/; max-age=60";
      cookiesOk = document.cookie.includes("device_check_test");
      document.cookie = "device_check_test=; path=/; max-age=0";
    } catch {
      cookiesOk = false;
    }
    out.push(
      cookiesOk
        ? { label: "ملفات تعريف الارتباط (Cookies)", status: "pass", detail: "مفعّلة، وهذا مطلوب لتسجيل دخولك للامتحان" }
        : {
            label: "ملفات تعريف الارتباط (Cookies)",
            status: "fail",
            detail: "تبدو معطّلة على هذا المتصفح — بدونها لن تستطيع الدخول إلى الامتحان إطلاقاً. فعّلها من إعدادات المتصفح",
          }
    );

    // 3. Connectivity
    out.push(
      navigator.onLine
        ? { label: "الاتصال بالإنترنت", status: "pass", detail: "متصل حالياً" }
        : {
            label: "الاتصال بالإنترنت",
            status: "fail",
            detail: "لا يوجد اتصال بالإنترنت الآن — تأكد من الاتصال قبل بدء الامتحان",
          }
    );

    // 4. Screen size
    const w = window.innerWidth;
    out.push(
      w >= 480
        ? { label: "حجم الشاشة", status: "pass", detail: `${w} بكسل — مناسب لعرض الامتحان بوضوح` }
        : {
            label: "حجم الشاشة",
            status: "warn",
            detail: `${w} بكسل — صغير نسبياً، الامتحان سيعمل لكن يفضَّل استخدام شاشة أكبر إن أمكن`,
          }
    );

    setResults(out);
    setRunning(false);
  }

  const overallFail = results?.some((r) => r.status === "fail");

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="تجربة الجهاز قبل الامتحان"
        icon={<Icon name="laptop" size={18} />}
        rightExtra={<ThemeToggle />}
      />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />

        <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue dark:bg-slate-700 dark:text-blue-300">
            <Icon name="laptop" size={24} />
          </div>
          <h1 className="text-center text-xl font-bold text-brand-navy-dark dark:text-slate-100">تحقّق من جهازك قبل الامتحان</h1>
          <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
            هذه الصفحة تفحص جاهزية متصفحك وجهازك فقط — لا علاقة لها بأي امتحان حقيقي، ولا تُسجَّل أي بيانات.
          </p>

          {!results && (
            <button
              onClick={runChecks}
              disabled={running}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
            >
              {running ? "جارٍ الفحص..." : "ابدأ الفحص"}
            </button>
          )}

          {results && (
            <div className="mt-6 flex flex-col gap-3">
              {results.map((r) => {
                const s = statusStyles(r.status);
                return (
                  <div key={r.label} className="flex items-start gap-3 rounded-xl bg-brand-panel/40 p-3 dark:bg-slate-700/40">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.bg} ${s.text}`}>
                      <Icon name={s.icon} size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.label}</p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{r.detail}</p>
                    </div>
                  </div>
                );
              })}

              <div
                className={`mt-2 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
                  overallFail
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                }`}
              >
                {overallFail
                  ? "يوجد مشكلة تمنع دخول الامتحان — يُفضَّل حلّها أو تجربة جهاز آخر"
                  : "جهازك جاهز لأداء الامتحان"}
              </div>

              <button
                onClick={() => setResults(null)}
                className="mt-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                إعادة الفحص
              </button>
            </div>
          )}

          <Link
            href="/exam/join"
            className="mt-4 block text-center text-sm font-medium text-brand-blue hover:underline dark:text-blue-400"
          >
            العودة إلى صفحة دخول الامتحان
          </Link>
        </div>
      </div>
    </div>
  );
}
