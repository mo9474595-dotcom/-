"use client";

import { useState } from "react";
import { useUI } from "@/components/ui/UIProvider";

export default function PortalLinkBox({
  studentId,
  initialToken,
  accessCount,
  lastAccessAt,
}: {
  studentId: string;
  initialToken: string;
  accessCount: number;
  lastAccessAt: Date | null;
}) {
  const { confirm, toast } = useUI();
  const [token, setToken] = useState(initialToken);
  const [stats, setStats] = useState({ accessCount, lastAccessAt });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const url =
    typeof window !== "undefined" ? `${window.location.origin}/student/${token}` : "";

  function copy() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regenerate() {
    const ok = await confirm({
      title: "إبطال الرابط الحالي؟",
      body: "سيتوقف الرابط الحالي عن العمل فوراً ولن يعمل بعدها لأي شخص يملكه.",
      confirmLabel: "إبطال وتوليد رابط جديد",
      danger: true,
    });
    if (!ok) return;
    setLoading(true);
    const res = await fetch(`/api/teacher/students/${studentId}/portal-link`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setToken(data.portalToken);
      setStats({ accessCount: 0, lastAccessAt: null });
      toast("تم إبطال الرابط القديم وتوليد رابط جديد", "success");
    } else {
      toast(data.error ?? "تعذر توليد رابط جديد", "error");
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="font-semibold text-blue-900">رابط بوابة الطالب</h2>
      <p className="mt-1 text-xs text-blue-700">
        رابط دائم وشخصي يتيح للطالب رؤية درجاته وحضوره وترتيبه، والدخول المباشر لامتحاناته
        المتاحة دون كلمة مرور.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700 break-all">{url}</code>
        <button
          onClick={copy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {copied ? "تم النسخ ✓" : "نسخ الرابط"}
        </button>
        <button
          onClick={regenerate}
          disabled={loading}
          className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {loading ? "..." : "إبطال الرابط وتوليد رابط جديد"}
        </button>
      </div>
      <p className="mt-3 text-xs text-blue-700">
        {stats.accessCount === 0
          ? "لم يُفتح هذا الرابط بعد."
          : `فُتح ${stats.accessCount} مرة${
              stats.lastAccessAt
                ? ` · آخر فتح: ${new Date(stats.lastAccessAt).toLocaleString("ar")}`
                : ""
            }`}
        {" — "}عدد فتحات مرتفع بشكل غير متوقع قد يعني أن الرابط انتشر خارج الطالب.
      </p>
    </div>
  );
}
