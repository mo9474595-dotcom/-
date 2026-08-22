"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StudentProfile } from "@prisma/client";
import { useUI } from "@/components/ui/UIProvider";
import { usePagedSearch } from "@/components/ui/usePagedSearch";
import PaginationBar from "@/components/ui/PaginationBar";
import Icon from "@/components/brand/Icon";

export default function RosterManager({
  classId,
  initialStudents,
}: {
  classId: string;
  initialStudents: StudentProfile[];
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [students, setStudents] = useState(initialStudents);
  const [namesText, setNamesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quote-aware CSV cell split so names containing a literal comma (e.g. "خالد, حسين")
  // don't get broken apart or leak stray quote characters.
  function parseCsvLine(line: string) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      // Skip an obvious header row (e.g. "name,ref" / "الاسم,الرقم")
      .filter((line, i) => !(i === 0 && /^(name|الاسم|full ?name)/i.test(line)));

    const parsed = lines
      .map((line) => {
        const [fullName, studentRef] = parseCsvLine(line);
        if (!fullName) return null;
        return studentRef ? `${fullName}, ${studentRef}` : fullName;
      })
      .filter((l): l is string => Boolean(l));

    if (parsed.length === 0) {
      setError("لم يتم العثور على أسماء صالحة في الملف");
      return;
    }
    setNamesText((prev) => (prev ? `${prev}\n${parsed.join("\n")}` : parsed.join("\n")));
    toast(`تم قراءة ${parsed.length} اسماً من الملف — راجعها ثم اضغط إضافة`, "success");
  }

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

    const existingNames = new Set(students.map((s) => s.fullName.trim().toLowerCase()));
    const duplicates = parsedStudents.filter((s) =>
      existingNames.has(s.fullName.trim().toLowerCase())
    );
    if (duplicates.length > 0) {
      const ok = await confirm({
        title: "أسماء مكررة في الشعبة",
        body: `يوجد بالفعل طالب بنفس الاسم: ${duplicates.map((d) => d.fullName).join("، ")}. سيُضاف كطالب منفصل. هل تريد المتابعة؟`,
        confirmLabel: "إضافة على أي حال",
      });
      if (!ok) {
        setLoading(false);
        return;
      }
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
    toast(`تمت إضافة ${parsedStudents.length} طالب`, "success");
    router.refresh();
  }

  async function handleDelete(studentId: string, studentName: string) {
    const ok = await confirm({
      title: `حذف ${studentName}؟`,
      body: "سيُحذف كل ما يتعلق بهذا الطالب من درجات وحضور ونتائج امتحانات بشكل نهائي.",
      confirmLabel: "حذف نهائياً",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/students/${studentId}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    toast("تم حذف الطالب", "success");
    router.refresh();
  }

  const { query, setQuery, page, setPage, pageCount, pageItems, totalCount, pageSize } =
    usePagedSearch(students, (s, q) =>
      s.fullName.toLowerCase().includes(q) || (s.studentRef ?? "").toLowerCase().includes(q)
    );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon name="users" size={17} className="text-brand-blue" />
        قائمة الطلاب ({students.length})
      </h2>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-600">
          أضف طلاباً (اسم في كل سطر، ويمكن إضافة الرقم الجامعي بعد فاصلة: <code>أحمد محمد, 1023</code>)
        </label>
        <textarea
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          rows={3}
          placeholder={"أحمد محمد, 1023\nسارة علي"}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 self-start rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
          >
            {loading ? "جارٍ الإضافة..." : "إضافة"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Icon name="folder" size={15} className="text-brand-blue" />
            رفع ملف CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </form>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الرقم الجامعي..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 pl-9 text-sm"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={16} />
          </span>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-3 py-2 font-medium">الاسم</th>
              <th className="px-3 py-2 font-medium">الرقم الجامعي</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">
                  <Link
                    href={`/teacher/classes/${classId}/students/${s.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {s.fullName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{s.studentRef || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => copyPortalLink(s.id, s.portalToken)}
                      className="text-xs font-medium text-brand-blue hover:underline"
                    >
                      {copiedId === s.id ? "تم النسخ ✓" : "نسخ رابط البوابة"}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.fullName)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                  {students.length === 0 ? "لا يوجد طلاب بعد." : "لا توجد نتائج مطابقة."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationBar
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
