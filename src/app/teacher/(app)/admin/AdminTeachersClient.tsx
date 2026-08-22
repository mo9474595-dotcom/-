"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import { usePagedSearch } from "@/components/ui/usePagedSearch";
import PaginationBar from "@/components/ui/PaginationBar";
import Icon from "@/components/brand/Icon";

type TeacherRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  _count: { classSections: number; exams: number };
};

export default function AdminTeachersClient({
  initialTeachers,
  currentAdminId,
}: {
  initialTeachers: TeacherRow[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [teachers, setTeachers] = useState(initialTeachers);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { query, setQuery, page, setPage, pageCount, pageItems, totalCount, pageSize } =
    usePagedSearch(
      teachers,
      (t, search) => t.name.toLowerCase().includes(search) || t.email.toLowerCase().includes(search)
    );

  async function handleDelete(teacher: TeacherRow) {
    const ok = await confirm({
      title: `حذف حساب ${teacher.name}؟`,
      body: `سيُحذف هذا الحساب نهائياً مع كل ما يتبعه من شعب وامتحانات وطلاب وبيانات (${teacher._count.classSections} شعبة، ${teacher._count.exams} امتحان). لا يمكن التراجع عن هذا.`,
      confirmLabel: "حذف نهائياً",
      danger: true,
    });
    if (!ok) return;

    setDeletingId(teacher.id);
    const res = await fetch(`/api/admin/teachers/${teacher.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast(data?.error ?? "تعذر حذف الحساب", "error");
      return;
    }
    setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    toast("تم حذف الحساب", "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="users" size={17} className="text-brand-blue" />
          الأساتذة ({teachers.length})
        </h2>
        <div className="relative w-full max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 pl-9 text-sm"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={16} />
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-3 py-2 font-medium">الاسم</th>
              <th className="px-3 py-2 font-medium">البريد الإلكتروني</th>
              <th className="px-3 py-2 font-medium">الشعب</th>
              <th className="px-3 py-2 font-medium">الامتحانات</th>
              <th className="px-3 py-2 font-medium">تاريخ التسجيل</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 font-medium text-slate-900">
                  {t.name}
                  {t.id === currentAdminId && (
                    <span className="mr-2 rounded-full bg-brand-panel px-2 py-0.5 text-xs text-brand-blue">
                      أنت
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600" dir="ltr">
                  {t.email}
                </td>
                <td className="px-3 py-2 text-slate-600">{t._count.classSections}</td>
                <td className="px-3 py-2 text-slate-600">{t._count.exams}</td>
                <td className="px-3 py-2 text-slate-600">
                  {new Date(t.createdAt).toLocaleDateString("ar-EG")}
                </td>
                <td className="px-3 py-2">
                  {t.id !== currentAdminId && (
                    <button
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                    >
                      {deletingId === t.id ? "جارٍ الحذف..." : "حذف"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  {teachers.length === 0 ? "لا يوجد أساتذة." : "لا توجد نتائج مطابقة."}
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
