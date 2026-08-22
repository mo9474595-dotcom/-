"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BankQuestion, BankChoice } from "@prisma/client";
import QuestionForm, { QuestionFormValue } from "@/components/QuestionForm";
import { useUI } from "@/components/ui/UIProvider";
import { usePagedSearch } from "@/components/ui/usePagedSearch";
import PaginationBar from "@/components/ui/PaginationBar";
import Icon from "@/components/brand/Icon";

type BankQuestionWithChoices = BankQuestion & { choices: BankChoice[] };

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح أو خطأ",
  SHORT_ANSWER: "إجابة قصيرة",
};

export default function QuestionBankClient({
  initialBankQuestions,
}: {
  initialBankQuestions: BankQuestionWithChoices[];
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [items, setItems] = useState(initialBankQuestions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { query, setQuery, page, setPage, pageCount, pageItems, totalCount, pageSize } =
    usePagedSearch(items, (q, search) => q.text.toLowerCase().includes(search));

  async function handleAdd(value: QuestionFormValue) {
    const res = await fetch("/api/teacher/question-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = await res.json();
    if (!res.ok) return data?.error ?? "تعذر إضافة السؤال";
    setItems((prev) => [data.bankQuestion, ...prev]);
    setShowAddForm(false);
    toast("تمت إضافة السؤال إلى البنك", "success");
    router.refresh();
  }

  async function handleEdit(bankQuestionId: string, value: QuestionFormValue) {
    const res = await fetch(`/api/teacher/question-bank/${bankQuestionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = await res.json();
    if (!res.ok) return data?.error ?? "تعذر تعديل السؤال";
    setItems((prev) => prev.map((it) => (it.id === bankQuestionId ? data.bankQuestion : it)));
    setEditingId(null);
    toast("تم حفظ التعديلات", "success");
    router.refresh();
  }

  async function handleDelete(bankQuestionId: string) {
    const ok = await confirm({
      title: "حذف السؤال من البنك؟",
      body: "لن يؤثر هذا على أي امتحان استُخدم فيه هذا السؤال سابقاً.",
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/question-bank/${bankQuestionId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== bankQuestionId));
    toast("تم حذف السؤال من البنك", "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="clipboard" size={17} className="text-brand-blue" />
          الأسئلة المحفوظة ({items.length})
        </h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            + إضافة سؤال جديد
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mt-4">
          <QuestionForm submitLabel="إضافة" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في نص الأسئلة..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {pageItems.map((q) => (
          <div key={q.id} className="rounded-xl bg-brand-panel/40 p-4">
            {editingId === q.id ? (
              <QuestionForm
                submitLabel="حفظ التعديلات"
                initial={{
                  type: q.type,
                  text: q.text,
                  points: q.points,
                  correctAnswer: q.correctAnswer ?? "",
                  choices: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
                }}
                onSubmit={(value) => handleEdit(q.id, value)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{q.text}</p>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {typeLabels[q.type]} · {q.points} درجة
                  </span>
                </div>
                {q.type !== "SHORT_ANSWER" && (
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
                    {q.choices.map((c) => (
                      <li key={c.id} className={c.isCorrect ? "font-semibold text-green-700" : ""}>
                        {c.isCorrect ? "✓ " : "• "}
                        {c.text}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-3 text-sm">
                  <button onClick={() => setEditingId(q.id)} className="font-medium text-brand-blue hover:underline">
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="font-medium text-red-600 hover:underline">
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {pageItems.length === 0 && !showAddForm && (
          <p className="py-6 text-center text-sm text-slate-500">
            {items.length === 0 ? "لا توجد أسئلة محفوظة بعد." : "لا توجد نتائج مطابقة."}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <PaginationBar page={page} pageCount={pageCount} totalCount={totalCount} pageSize={pageSize} onPageChange={setPage} />
      )}
    </div>
  );
}
