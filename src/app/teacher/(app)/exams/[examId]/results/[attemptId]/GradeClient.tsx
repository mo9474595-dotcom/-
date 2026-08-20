"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question, Choice, Answer } from "@prisma/client";

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

  async function saveGrade(answerId: string, points: number) {
    setSaving(answerId);
    await fetch(`/api/teacher/attempts/${attemptId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId, pointsAwarded: points }),
    });
    setSaving(null);
    router.refresh();
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

            {question.type !== "SHORT_ANSWER" ? (
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
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {answer?.textAnswer || <span className="text-slate-400">لم يُجب</span>}
                </p>
                <ShortAnswerGrader
                  maxPoints={question.points}
                  currentPoints={answer?.pointsAwarded ?? null}
                  disabled={!answer || saving === answer?.id}
                  onSave={(points) => answer && saveGrade(answer.id, points)}
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
  disabled,
  onSave,
}: {
  maxPoints: number;
  currentPoints: number | null;
  disabled: boolean;
  onSave: (points: number) => void;
}) {
  const [points, setPoints] = useState(currentPoints ?? 0);

  return (
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
        onClick={() => onSave(points)}
        disabled={disabled}
        className="rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
      >
        حفظ الدرجة
      </button>
      {currentPoints != null && (
        <span className="text-xs text-green-700">آخر درجة محفوظة: {currentPoints}</span>
      )}
    </div>
  );
}
