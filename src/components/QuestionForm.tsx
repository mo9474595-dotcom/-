"use client";

import { useState } from "react";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export type QuestionFormValue = {
  type: QuestionType;
  text: string;
  points: number;
  correctAnswer: string;
  choices: { text: string; isCorrect: boolean }[];
};

const emptyValue: QuestionFormValue = {
  type: "MULTIPLE_CHOICE",
  text: "",
  points: 1,
  correctAnswer: "",
  choices: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
};

export default function QuestionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: QuestionFormValue;
  submitLabel: string;
  onSubmit: (value: QuestionFormValue) => Promise<string | void>;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState<QuestionFormValue>(initial ?? emptyValue);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateChoice(index: number, patch: Partial<{ text: string; isCorrect: boolean }>) {
    setValue((v) => ({
      ...v,
      choices: v.choices.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function setSingleCorrectChoice(index: number) {
    setValue((v) => ({
      ...v,
      choices: v.choices.map((c, i) => ({ ...c, isCorrect: i === index })),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSubmit(value);
    setLoading(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">نوع السؤال</label>
          <select
            value={value.type}
            onChange={(e) => {
              const type = e.target.value as QuestionType;
              setValue((v) => ({
                ...v,
                type,
                choices:
                  type === "MULTIPLE_CHOICE" && v.choices.length < 2
                    ? emptyValue.choices
                    : v.choices,
              }));
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="MULTIPLE_CHOICE">اختيار من متعدد</option>
            <option value="TRUE_FALSE">صح أو خطأ</option>
            <option value="SHORT_ANSWER">إجابة قصيرة (تصحيح يدوي)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">الدرجة</label>
          <input
            type="number"
            min={1}
            max={100}
            value={value.points}
            onChange={(e) => setValue((v) => ({ ...v, points: Number(e.target.value) }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">نص السؤال</label>
        <textarea
          value={value.text}
          onChange={(e) => setValue((v) => ({ ...v, text: e.target.value }))}
          rows={2}
          required
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      {value.type === "MULTIPLE_CHOICE" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600">
            الخيارات (حدد الدائرة أمام الخيار الصحيح)
          </label>
          {value.choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctChoice"
                checked={c.isCorrect}
                onChange={() => setSingleCorrectChoice(i)}
              />
              <input
                value={c.text}
                onChange={(e) => updateChoice(i, { text: e.target.value })}
                placeholder={`خيار ${i + 1}`}
                required
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              {value.choices.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    setValue((v) => ({ ...v, choices: v.choices.filter((_, idx) => idx !== i) }))
                  }
                  className="text-sm text-red-600 hover:underline"
                >
                  حذف
                </button>
              )}
            </div>
          ))}
          {value.choices.length < 8 && (
            <button
              type="button"
              onClick={() =>
                setValue((v) => ({ ...v, choices: [...v.choices, { text: "", isCorrect: false }] }))
              }
              className="self-start text-sm font-medium text-blue-600 hover:underline"
            >
              + إضافة خيار
            </button>
          )}
        </div>
      )}

      {value.type === "TRUE_FALSE" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">الإجابة الصحيحة</label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tf"
                checked={value.correctAnswer === "true"}
                onChange={() => setValue((v) => ({ ...v, correctAnswer: "true" }))}
              />
              صح
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tf"
                checked={value.correctAnswer === "false"}
                onChange={() => setValue((v) => ({ ...v, correctAnswer: "false" }))}
              />
              خطأ
            </label>
          </div>
        </div>
      )}

      {value.type === "SHORT_ANSWER" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            إجابة نموذجية للتصحيح التلقائي (اختياري — مطابقة تامة، وإلا يصحح الأستاذ يدوياً)
          </label>
          <input
            value={value.correctAnswer}
            onChange={(e) => setValue((v) => ({ ...v, correctAnswer: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "جارٍ الحفظ..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}
