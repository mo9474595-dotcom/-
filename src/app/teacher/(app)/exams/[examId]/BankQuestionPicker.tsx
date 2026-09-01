"use client";

import { useEffect, useState } from "react";
import type { BankQuestion, BankChoice } from "@prisma/client";
import Link from "next/link";

type BankQuestionWithChoices = BankQuestion & { choices: BankChoice[] };

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح أو خطأ",
  SHORT_ANSWER: "إجابة قصيرة",
  AUDIO_ANSWER: "إجابة صوتية",
};

export default function BankQuestionPicker({
  onAdd,
  onCancel,
}: {
  onAdd: (bankQuestionIds: string[]) => Promise<string | void>;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<BankQuestionWithChoices[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/question-bank")
      .then((res) => res.json())
      .then((data) => setItems(data.bankQuestions ?? []))
      .catch(() => setItems([]));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      setError("اختر سؤالاً واحداً على الأقل");
      return;
    }
    setError(null);
    setLoading(true);
    const err = await onAdd(Array.from(selected));
    setLoading(false);
    if (err) setError(err);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {items === null && <p className="text-sm text-slate-500">جارٍ التحميل...</p>}

      {items !== null && items.length === 0 && (
        <p className="text-sm text-slate-500">
          لا توجد أسئلة محفوظة في البنك بعد.{" "}
          <Link href="/teacher/question-bank" className="font-medium text-brand-blue hover:underline">
            أضف أسئلة إلى البنك
          </Link>{" "}
          أولاً.
        </p>
      )}

      {items !== null && items.length > 0 && (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {items.map((q) => (
            <label
              key={q.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg bg-white p-3 text-sm shadow-sm"
            >
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => toggle(q.id)}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block font-medium text-slate-900">{q.text}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {typeLabels[q.type]} · {q.points} درجة
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !items?.length}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الإضافة..." : `إضافة (${selected.size})`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
