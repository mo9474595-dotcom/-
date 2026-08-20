"use client";

import { useState } from "react";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

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
    <div className="rounded-2xl bg-brand-panel p-5">
      <h2 className="flex items-center gap-2 font-semibold text-brand-navy-dark">
        رابط بوابة الطالب
        <Icon name="globe" size={16} />
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        رابط خاص يمنح الطالب رؤية درجاته وواجباته ونتائجه من خلال بوابة الطالب.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-full bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-navy"
        >
          <Icon name="clipboard" size={14} />
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
        <button
          onClick={regenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <Icon name="clockHistory" size={14} />
          {loading ? "..." : "توليد رابط جديد"}
        </button>
        <code className="flex-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 break-all">{url}</code>
      </div>
      <p className="mt-3 text-xs text-slate-600">
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
