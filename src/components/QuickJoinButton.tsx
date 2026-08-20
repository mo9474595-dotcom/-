"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickJoinButton({
  code,
  studentName,
  studentRef,
  label,
}: {
  code: string;
  studentName: string;
  studentRef: string | null;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/exam/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, studentName, studentRef: studentRef ?? undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر بدء الامتحان");
      return;
    }
    router.push(`/exam/${data.attemptId}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
      >
        {loading ? "..." : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
