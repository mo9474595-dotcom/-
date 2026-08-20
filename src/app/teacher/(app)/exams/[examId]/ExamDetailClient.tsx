"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exam, Question, Choice } from "@prisma/client";
import QuestionForm, { QuestionFormValue } from "@/components/QuestionForm";

type QuestionWithChoices = Question & { choices: Choice[] };
type ExamWithQuestions = Exam & { questions: QuestionWithChoices[] };

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح أو خطأ",
  SHORT_ANSWER: "إجابة قصيرة",
};

export default function ExamDetailClient({ exam }: { exam: ExamWithQuestions }) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(exam.isPublished);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function togglePublish() {
    setPublishError(null);
    if (!isPublished && exam.questions.length === 0) {
      setPublishError("أضف سؤالاً واحداً على الأقل قبل النشر");
      return;
    }
    setPublishing(true);
    const res = await fetch(`/api/teacher/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setPublishing(false);
    if (res.ok) {
      setIsPublished(!isPublished);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setPublishError(data?.error ?? "تعذر تحديث حالة النشر");
    }
  }

  async function handleAddQuestion(value: QuestionFormValue) {
    const res = await fetch(`/api/teacher/exams/${exam.id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "تعذر إضافة السؤال";
    }
    setShowAddForm(false);
    router.refresh();
  }

  async function handleEditQuestion(questionId: string, value: QuestionFormValue) {
    const res = await fetch(`/api/teacher/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "تعذر تعديل السؤال";
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("هل تريد حذف هذا السؤال؟")) return;
    await fetch(`/api/teacher/questions/${questionId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {exam.durationMinutes} دقيقة · حد المخالفات: {exam.maxTabViolations} ·{" "}
              {exam.shuffleQuestions ? "أسئلة عشوائية" : "أسئلة بترتيب ثابت"} ·{" "}
              {exam.shuffleChoices ? "خيارات عشوائية" : "خيارات بترتيب ثابت"}
            </p>
            {exam.description && <p className="mt-1 text-sm text-slate-600">{exam.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                isPublished ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isPublished ? "إلغاء النشر" : "نشر الامتحان"}
            </button>
            {publishError && <p className="text-xs text-red-600">{publishError}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">الأسئلة ({exam.questions.length})</h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + إضافة سؤال
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="mt-4">
            <QuestionForm
              submitLabel="إضافة السؤال"
              onSubmit={handleAddQuestion}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {exam.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-200 p-4">
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
                  onSubmit={(value) => handleEditQuestion(q.id, value)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {i + 1}. {q.text}
                    </p>
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
                    <button
                      onClick={() => setEditingId(q.id)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {exam.questions.length === 0 && !showAddForm && (
            <p className="py-6 text-center text-sm text-slate-500">لا توجد أسئلة بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
}
