"use client";

import { useEffect, useState } from "react";
import type { AttendanceSession, AttendanceRecord, StudentProfile } from "@prisma/client";

type Row = { student: StudentProfile; record: AttendanceRecord | null };

const statusOptions: { value: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"; label: string; className: string }[] = [
  { value: "PRESENT", label: "حاضر", className: "bg-green-600" },
  { value: "LATE", label: "متأخر", className: "bg-amber-500" },
  { value: "ABSENT", label: "غائب", className: "bg-red-600" },
  { value: "EXCUSED", label: "معذور", className: "bg-slate-500" },
];

export default function AttendanceMarkingClient({
  session,
  initialRows,
}: {
  session: AttendanceSession;
  initialRows: Row[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [checkinCode, setCheckinCode] = useState(session.selfCheckinCode);
  const [closesAt, setClosesAt] = useState<string | null>(
    session.selfCheckinClosesAt ? session.selfCheckinClosesAt.toString() : null
  );
  const [minutes, setMinutes] = useState(15);
  const [toggling, setToggling] = useState(false);
  // Starts null (no impure Date.now() call during render) and is filled in
  // by the ticking interval below, which is an actual timer callback.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isOpen =
    checkinCode != null && closesAt != null && now != null && now < new Date(closesAt).getTime();
  const checkinUrl = checkinCode ? `/attendance/checkin?code=${checkinCode}` : null;

  async function toggleCheckin(action: "open" | "close") {
    setToggling(true);
    const res = await fetch(`/api/teacher/attendance/${session.id}/checkin-toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, minutes }),
    });
    const data = await res.json();
    setToggling(false);
    if (res.ok) {
      setCheckinCode(data.session.selfCheckinCode);
      setClosesAt(data.session.selfCheckinClosesAt);
    }
  }

  async function mark(studentId: string, status: (typeof statusOptions)[number]["value"]) {
    const res = await fetch(`/api/teacher/attendance/${session.id}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentProfileId: studentId, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setRows((prev) =>
        prev.map((r) => (r.student.id === studentId ? { ...r, record: data.record } : r))
      );
    }
  }

  async function markAll(status: (typeof statusOptions)[number]["value"]) {
    await Promise.all(rows.map((r) => mark(r.student.id, status)));
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">تسجيل حضور ذاتي</h2>
        {isOpen && checkinCode ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">رمز الحضور (صالح حتى إغلاقه)</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-blue-700">
                {checkinCode}
              </p>
              {checkinUrl && <p className="text-xs text-slate-400">{checkinUrl}</p>}
            </div>
            <button
              onClick={() => toggleCheckin("close")}
              disabled={toggling}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              إغلاق التسجيل الذاتي
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">مدة الفتح (دقائق)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => toggleCheckin("open")}
              disabled={toggling}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              فتح التسجيل الذاتي
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">تسجيل يدوي</h2>
          <div className="flex gap-2 text-xs">
            <span className="self-center text-slate-500">تعليم الكل:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => markAll(opt.value)}
                className={`rounded-full px-3 py-1 font-medium text-white ${opt.className}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.student.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"
            >
              <span className="font-medium text-slate-900">{row.student.fullName}</span>
              <div className="flex gap-1.5">
                {statusOptions.map((opt) => {
                  const active = row.record?.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => mark(row.student.id, opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        active ? `${opt.className} text-white` : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {row.record?.markedBySelf && (
                  <span className="self-center text-xs text-slate-400">(ذاتي)</span>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">لا يوجد طلاب في هذه الشعبة.</p>
          )}
        </div>
      </div>
    </div>
  );
}
