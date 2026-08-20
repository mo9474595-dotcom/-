"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AttendanceSession } from "@prisma/client";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

type SessionWithRecords = AttendanceSession & { records: { status: string }[] };

export default function AttendanceSessionsClient({
  classId,
  initialSessions,
}: {
  classId: string;
  initialSessions: SessionWithRecords[];
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [sessions, setSessions] = useState(initialSessions);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/teacher/classes/${classId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSessions((prev) => [{ ...data.session, records: [] }, ...prev]);
      setTitle("");
      toast("تم إنشاء جلسة الحضور", "success");
      router.refresh();
    }
  }

  async function handleDelete(sessionId: string) {
    const ok = await confirm({
      title: "حذف جلسة الحضور؟",
      body: "سيُحذف سجل حضور جميع الطلاب لهذه الجلسة نهائياً.",
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/attendance/${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast("تم حذف الجلسة", "success");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">عنوان الجلسة (اختياري)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="محاضرة 3"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          {loading ? "جارٍ الإنشاء..." : "+ جلسة جديدة"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {sessions.map((s) => {
          const present = s.records.filter((r) => r.status === "PRESENT").length;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
                  <Icon name="calendarCheck" size={16} />
                </span>
                <div>
                <p className="font-medium text-slate-900">{s.title || "جلسة بدون عنوان"}</p>
                <p className="text-sm text-slate-500">
                  {new Date(s.date).toLocaleDateString("ar")} · {present} حاضر من {s.records.length} مسجَّل
                </p>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <Link
                  href={`/teacher/classes/${classId}/attendance/${s.id}`}
                  className="font-medium text-brand-blue hover:underline"
                >
                  تسجيل الحضور
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white py-8 text-center text-slate-500">
            لا توجد جلسات حضور بعد.
          </p>
        )}
      </div>
    </div>
  );
}
