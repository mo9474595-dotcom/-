"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question, Choice, Answer, FeedbackSnippet } from "@prisma/client";
import { textSimilarity } from "@/lib/text-similarity";

type Item = {
  question: Question & { choices: Choice[] };
  answer: Answer | null;
};

export default function GradeClient({
  attemptId,
  items,
}: {
  attemptId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<FeedbackSnippet[]>([]);

  useEffect(() => {
    fetch("/api/teacher/feedback-snippets")
      .then((r) => r.json())
      .then((d) => setSnippets(d.snippets ?? []))
      .catch(() => {});
  }, []);

  async function saveGrade(answerId: string, points: number, feedback: string) {
    setSaving(answerId);
    await fetch(`/api/teacher/attempts/${attemptId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, pointsAwarded: points, feedback }),
    });
    setSaving(null);
    router.refresh();
  }

  async function addSnippet(text: string) {
    const res = await fetch("/api/teacher/feedback-snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSnippets((prev) => [data.snippet, ...prev]);
  }

  async function deleteSnippet(id: string) {
    await fetch(`/api/teacher/feedback-snippets/${id}`, { method: "DELETE" });
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">الإجابات</h2>
      <div className="mt-4 flex flex-col gap-4">
        {items.map(({ question, answer }, i) => (
          <div key={question.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">
                {i + 1}. {question.text}
              </p>
              <span className="shrink-0 text-xs text-slate-500">{question.points} درجة</span>
            </div>

            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
              <img
                src={question.imageUrl}
                alt="صورة السؤال"
                className="mt-2 max-h-48 rounded-lg border border-slate-200 object-contain"
              />
            )}

            {question.type !== "SHORT_ANSWER" && question.type !== "AUDIO_ANSWER" ? (
              <div className="mt-2 flex flex-col gap-1 text-sm">
                {question.choices.map((c) => {
                  const chosen = answer?.selectedChoiceId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={
                        c.isCorrect
                          ? "font-semibold text-green-700"
                          : chosen
                          ? "font-semibold text-red-700"
                          : "text-slate-500"
                      }
                    >
                      {chosen ? "◉ " : "○ "}
                      {c.text}
                      {c.isCorrect && " (الإجابة الصحيحة)"}
                    </div>
                  );
                })}
                {!answer && <p className="text-sm text-slate-400">لم يُجب الطالب على هذا السؤال</p>}
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {question.type === "AUDIO_ANSWER" ? (
                  answer?.audioUrl ? (
                    <audio controls src={answer.audioUrl} className="w-full" />
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">لم يُجب</p>
                  )
                ) : (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {answer?.textAnswer || <span className="text-slate-400">لم يُجب</span>}
                  </p>
                )}
                <ShortAnswerGrader
                  maxPoints={question.points}
                  currentPoints={answer?.pointsAwarded ?? null}
                  currentFeedback={answer?.feedback ?? ""}
                  studentAnswer={answer?.textAnswer ?? null}
                  modelAnswer={question.correctAnswer}
                  snippets={snippets}
                  disabled={!answer || saving === answer?.id}
                  onSave={(points, feedback) => answer && saveGrade(answer.id, points, feedback)}
                  onAddSnippet={addSnippet}
                  onDeleteSnippet={deleteSnippet}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortAnswerGrader({
  maxPoints,
  currentPoints,
  currentFeedback,
  studentAnswer,
  modelAnswer,
  snippets,
  disabled,
  onSave,
  onAddSnippet,
  onDeleteSnippet,
}: {
  maxPoints: number;
  currentPoints: number | null;
  currentFeedback: string;
  studentAnswer: string | null;
  modelAnswer: string | null;
  snippets: FeedbackSnippet[];
  disabled: boolean;
  onSave: (points: number, feedback: string) => void;
  onAddSnippet: (text: string) => void;
  onDeleteSnippet: (id: string) => void;
}) {
  const [points, setPoints] = useState(currentPoints ?? 0);
  const [feedback, setFeedback] = useState(currentFeedback);
  const [showSnippets, setShowSnippets] = useState(false);

  // A word-overlap suggestion against the teacher's model answer — a
  // starting point the teacher can accept or ignore, never applied
  // automatically, since exact wording match is a poor proxy for whether a
  // short answer is actually correct.
  const suggestion = useMemo(() => {
    if (!modelAnswer?.trim() || !studentAnswer?.trim() || currentPoints != null) return null;
    const similarity = textSimilarity(studentAnswer, modelAnswer);
    return { similarity, points: Math.round(similarity * maxPoints) };
  }, [modelAnswer, studentAnswer, maxPoints, currentPoints]);

  return (
    <div className="flex flex-col gap-2">
      {suggestion && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
          <span className="text-blue-700">
            اقتراح تلقائي بناءً على تشابه الكلمات مع الإجابة النموذجية (
            {Math.round(suggestion.similarity * 100)}%): {suggestion.points} / {maxPoints}
          </span>
          <button
            type="button"
            onClick={() => setPoints(suggestion.points)}
            className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 font-medium text-white hover:bg-blue-700"
          >
            استخدام الاقتراح
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={maxPoints}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-20 rounded-xl border border-slate-300 px-2 py-1 text-sm"
        />
        <span className="text-xs text-slate-500">/ {maxPoints}</span>
        <button
          onClick={() => onSave(points, feedback)}
          disabled={disabled}
          className="rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          حفظ الدرجة
        </button>
        {currentPoints != null && (
          <span className="text-xs text-green-700">آخر درجة محفوظة: {currentPoints}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">ملاحظة للطالب (اختياري)</label>
          <button
            type="button"
            onClick={() => setShowSnippets((v) => !v)}
            className="text-xs font-medium text-brand-blue hover:underline"
          >
            {showSnippets ? "إخفاء الملاحظات الجاهزة" : "إدراج ملاحظة جاهزة"}
          </button>
        </div>

        {showSnippets && (
          <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
            {snippets.length === 0 && (
              <p className="text-xs text-slate-400">لا توجد ملاحظات محفوظة بعد.</p>
            )}
            {snippets.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFeedback(s.text)}
                  className="flex-1 truncate text-right text-slate-700 hover:text-brand-blue hover:underline"
                  title={s.text}
                >
                  {s.text}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSnippet(s.id)}
                  className="shrink-0 text-red-500 hover:underline"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          placeholder="مثال: إجابة ناقصة، راجع تعريف المفهوم"
          className="rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100"
        />
        {feedback.trim() && (
          <button
            type="button"
            onClick={() => onAddSnippet(feedback.trim())}
            className="self-start text-xs font-medium text-slate-500 hover:text-brand-blue hover:underline"
          >
            + حفظ هذا النص كملاحظة جاهزة لاستخدامه لاحقاً
          </button>
        )}
      </div>
    </div>
  );
}
