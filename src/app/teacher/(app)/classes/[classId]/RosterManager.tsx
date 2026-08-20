"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudentProfile } from "@prisma/client";

export default function RosterManager({
  classId,
  initialStudents,
}: {
  classId: string;
  initialStudents: StudentProfile[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [namesText, setNamesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyPortalLink(studentId: string, portalToken: string) {
    const url = `${window.location.origin}/student/${portalToken}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(studentId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const parsedStudents = namesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [fullName, studentRef] = line.split(",").map((p) => p.trim());
        return { fullName, studentRef: studentRef || undefined };
      });

    if (parsedStudents.length === 0) {
      setError("أضف اسماً واحداً على الأقل");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/teacher/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students: parsedStudents }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر إضافة الطلاب");
      return;
    }
    setStudents(data.students);
    setNamesText("");
    router.refresh();
  }

  async function handleDelete(studentId: string) {
    if (!confirm("هل تريد حذف هذا الطالب؟ سيُحذف كل ما يتعلق به من درجات وحضور.")) return;
    await fetch(`/api/teacher/students/${studentId}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">قائمة الطلاب ({students.length})</h2>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-600">
          أضف طلاباً (اسم في كل سطر، ويمكن إضافة الرقم الجامعي بعد فاصلة: <code>أحمد محمد, 1023</code>)
        </label>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          rows={3}
          placeholder={"أحمد محمد, 1023\nسارة علي"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الإضافة..." : "إضافة"}
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-3 py-2 font-medium">الاسم</th>
              <th className="px-3 py-2 font-medium">الرقم الجامعي</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">
                  <Link
                    href={`/teacher/classes/${classId}/students/${s.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {s.fullName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{s.studentRef || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyPortalLink(s.id, s.portalToken)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {copiedId === s.id ? "تم النسخ ✓" : "نسخ رابط البوابة"}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  لا يوجد طلاب بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
