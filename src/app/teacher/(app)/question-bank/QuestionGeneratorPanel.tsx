"use client";

import { useState } from "react";
import QuestionForm, { QuestionFormValue } from "@/components/QuestionForm";
import Icon from "@/components/brand/Icon";

type Draft = QuestionFormValue & { key: string };

export default function QuestionGeneratorPanel({
  onAdd,
}: {
  onAdd: (value: QuestionFormValue) => Promise<string | void>;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function generate() {
    setError(null);
    if (mode === "text" && text.trim().length < 30) {
      setError("أدخل نصاً أطول (30 حرفاً على الأقل) لتوليد أسئلة منه");
      return;
    }
    if (mode === "pdf" && !file) {
      setError("اختر ملف PDF أولاً");
      return;
    }
    setLoading(true);
    const form = new FormData();
    if (mode === "text") form.append("text", text);
    else if (file) form.append("file", file);

    const res = await fetch("/api/teacher/question-bank/generate", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "تعذر توليد الأسئلة");
      return;
    }
    setDrafts(
      (data.drafts as QuestionFormValue[]).map((d, i) => ({
        ...d,
        key: `${Date.now()}-${i}`,
      }))
    );
  }

  async function acceptDraft(draft: Draft, value: QuestionFormValue) {
    setSavingKey(draft.key);
    const err = await onAdd(value);
    setSavingKey(null);
    if (err) {
      setError(err);
      return;
    }
    setDrafts((prev) => prev.filter((d) => d.key !== draft.key));
    setEditingKey(null);
  }

  function discardDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  return (
    <div className="rounded-2xl border border-dashed border-brand-blue/40 bg-brand-panel/30 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-right"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="bulb" size={17} className="text-brand-blue" />
          توليد أسئلة تلقائياً من نص أو ملف PDF
        </span>
        <span className="text-xs font-medium text-brand-blue">{open ? "إخفاء" : "فتح"}</span>
      </button>

      {open && (
        <div className="mt-4">
          <p className="text-xs text-slate-500">
            يحلل النص أو الملف ويقترح أسئلة (اختيار من متعدد أو إجابة قصيرة) بأسلوب &quot;أكمل الفراغ&quot;،
            تراجعها وتعدّلها قبل إضافتها للبنك. توليد بأسلوب تحليل نصي مباشر، وليس بالذكاء الاصطناعي
            — النتائج مسودّات تحتاج مراجعتك دائماً.
          </p>

          <div className="mt-3 flex gap-2 text-sm">
            <button
              onClick={() => setMode("text")}
              className={`rounded-full px-3 py-1.5 font-medium ${
                mode === "text" ? "bg-brand-blue text-white" : "bg-white text-slate-600"
              }`}
            >
              نص
            </button>
            <button
              onClick={() => setMode("pdf")}
              className={`rounded-full px-3 py-1.5 font-medium ${
                mode === "pdf" ? "bg-brand-blue text-white" : "bg-white text-slate-600"
              }`}
            >
              ملف PDF
            </button>
          </div>

          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="الصق نص الدرس أو الفصل هنا..."
              rows={5}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm"
            />
          )}

          {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            onClick={generate}
            disabled={loading}
            className="mt-3 flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
          >
            <Icon name="bulb" size={14} />
            {loading ? "جارٍ التوليد..." : "توليد الأسئلة"}
          </button>

          {drafts.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700">
                مسودات مقترحة ({drafts.length}) — راجعها قبل الإضافة
              </p>
              {drafts.map((d) =>
                editingKey === d.key ? (
                  <QuestionForm
                    key={d.key}
                    submitLabel="إضافة إلى البنك"
                    initial={d}
                    onSubmit={(value) => acceptDraft(d, value)}
                    onCancel={() => setEditingKey(null)}
                  />
                ) : (
                  <div key={d.key} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-medium text-slate-900">{d.text}</p>
                    {d.type === "MULTIPLE_CHOICE" && (
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
                        {d.choices.map((c, i) => (
                          <li key={i} className={c.isCorrect ? "font-semibold text-green-700" : ""}>
                            {c.isCorrect ? "✓ " : "• "}
                            {c.text}
                          </li>
                        ))}
                      </ul>
                    )}
                    {d.type === "SHORT_ANSWER" && (
                      <p className="mt-2 text-sm text-slate-600">
                        الإجابة الصحيحة: <span className="font-semibold text-green-700">{d.correctAnswer}</span>
                      </p>
                    )}
                    <div className="mt-3 flex gap-3 text-sm">
                      <button
                        onClick={() => acceptDraft(d, d)}
                        disabled={savingKey === d.key}
                        className="font-medium text-brand-blue hover:underline disabled:opacity-60"
                      >
                        {savingKey === d.key ? "جارٍ الإضافة..." : "إضافة للبنك"}
                      </button>
                      <button onClick={() => setEditingKey(d.key)} className="font-medium text-slate-600 hover:underline">
                        تعديل قبل الإضافة
                      </button>
                      <button onClick={() => discardDraft(d.key)} className="font-medium text-red-600 hover:underline">
                        تجاهل
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
