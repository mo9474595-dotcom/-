"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";

type TrashedClass = { id: string; name: string; deletedAt: Date | null };
type TrashedExam = { id: string; title: string; deletedAt: Date | null };

export default function TrashClient({
  classes,
  exams,
}: {
  classes: TrashedClass[];
  exams: TrashedExam[];
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function restore(kind: "classes" | "exams", id: string, label: string) {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/teacher/${kind}/${id}/restore`, { method: "POST" });
      if (!res.ok) {
        toast("تعذرت الاستعادة، حاول مرة أخرى", "error");
        return;
      }
      toast(`تمت استعادة "${label}"`, "success");
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">الشعب المحذوفة</h2>
        {classes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد شعب محذوفة.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    حُذفت في {c.deletedAt ? new Date(c.deletedAt).toLocaleString("ar") : ""}
                  </p>
                </div>
                <button
                  onClick={() => restore("classes", c.id, c.name)}
                  disabled={restoringId === c.id}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  استعادة
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">الامتحانات المحذوفة</h2>
        {exams.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد امتحانات محذوفة.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {exams.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    حُذف في {e.deletedAt ? new Date(e.deletedAt).toLocaleString("ar") : ""}
                  </p>
                </div>
                <button
                  onClick={() => restore("exams", e.id, e.title)}
                  disabled={restoringId === e.id}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  استعادة
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
