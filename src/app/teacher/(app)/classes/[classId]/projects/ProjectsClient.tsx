"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@prisma/client";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

type ProjectWithGrades = Project & { grades: { score: number | null }[] };

export default function ProjectsClient({
  classId,
  initialProjects,
}: {
  classId: string;
  initialProjects: ProjectWithGrades[];
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      maxScore: formData.get("maxScore"),
      dueDate: formData.get("dueDate"),
    };

    const res = await fetch(`/api/teacher/classes/${classId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "تعذر إنشاء المشروع");
      return;
    }
    setProjects((prev) => [{ ...data.project, grades: [] }, ...prev]);
    setShowForm(false);
    toast("تم إنشاء المشروع", "success");
    router.refresh();
  }

  async function handleDelete(projectId: string) {
    const ok = await confirm({
      title: "حذف المشروع؟",
      body: "سيُحذف المشروع وكل درجات الطلاب فيه نهائياً.",
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/projects/${projectId}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    toast("تم حذف المشروع", "success");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Icon name="folder" size={17} className="text-brand-blue" />
            قائمة المشاريع
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + مشروع جديد
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">عنوان المشروع</label>
              <input name="title" required className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">وصف (اختياري)</label>
              <textarea name="description" rows={2} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">الدرجة القصوى</label>
                <input name="maxScore" type="number" min={1} defaultValue={100} required className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">تاريخ التسليم (اختياري)</label>
                <input name="dueDate" type="date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" />
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
              >
                {loading ? "جارٍ الحفظ..." : "إنشاء"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {projects.map((p) => {
            const gradedCount = p.grades.filter((g) => g.score != null).length;
            return (
              <div key={p.id} className="rounded-xl bg-brand-panel/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{p.title}</p>
                    {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      من {p.maxScore} درجة · {gradedCount} طالب مُصحَّح
                      {p.dueDate && ` · التسليم: ${new Date(p.dueDate).toLocaleDateString("ar")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3 text-sm">
                    <Link
                      href={`/teacher/classes/${classId}/projects/${p.id}`}
                      className="flex items-center gap-1 font-medium text-brand-blue hover:underline"
                    >
                      تصحيح الدرجات
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && !showForm && (
            <p className="py-6 text-center text-sm text-slate-500">لا توجد مشاريع بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}
