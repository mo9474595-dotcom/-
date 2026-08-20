"use client";

import { useState } from "react";

export default function PortalLinkBox({
  studentId,
  initialToken,
}: {
  studentId: string;
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
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
    if (!confirm("سيتوقف الرابط الحالي عن العمل فوراً. هل تريد المتابعة؟")) return;
    setLoading(true);
    const res = await fetch(`/api/teacher/students/${studentId}/portal-link`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setToken(data.portalToken);
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
    </div>
  );
}
