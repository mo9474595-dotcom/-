"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exam, Question, Choice } from "@prisma/client";
import QuestionForm, { QuestionFormValue } from "@/components/QuestionForm";
import { useUI } from "@/components/ui/UIProvider";
import ExamScheduleEditor from "./ExamScheduleEditor";
import BankQuestionPicker from "./BankQuestionPicker";
import Icon from "@/components/brand/Icon";

type QuestionWithChoices = Question & { choices: Choice[] };
type ExamWithQuestions = Exam & { questions: QuestionWithChoices[] };

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  TRUE_FALSE: "صح أو خطأ",
  SHORT_ANSWER: "إجابة قصيرة",
};

export default function ExamDetailClient({ exam }: { exam: ExamWithQuestions }) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [isPublished, setIsPublished] = useState(exam.isPublished);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingToBankId, setSavingToBankId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [cloning, setCloning] = useState(false);
  // Tracked separately from exam.questions (a server-refreshed prop) so the
  // publish guard can't read a stale count: router.refresh() after adding a
  // question is async, and a teacher who publishes right after adding
  // their first question could otherwise hit this guard before that
  // refresh has landed.
  const [questionCount, setQuestionCount] = useState(exam.questions.length);

  async function togglePublish() {
    setPublishError(null);
    if (!isPublished && questionCount === 0) {
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
      toast(!isPublished ? "تم نشر الامتحان" : "تم إلغاء نشر الامتحان", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setPublishError(data?.error ?? "تعذر تحديث حالة النشر");
    }
  }

  async function handleDeleteExam() {
    const ok = await confirm({
      title: "حذف الامتحان",
      body: "سيُنقل هذا الامتحان إلى سلة المحذوفات ولن يظهر في قائمتك، ويمكنك استعادته لاحقاً منها.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/teacher/exams/${exam.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("تعذر حذف الامتحان", "error");
      return;
    }
    toast("تم نقل الامتحان إلى سلة المحذوفات", "success");
    router.push("/teacher/dashboard");
    router.refresh();
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
    setQuestionCount((c) => c + 1);
    toast("تمت إضافة السؤال", "success");
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
    toast("تم حفظ التعديلات", "success");
    router.refresh();
  }

  async function handleDeleteQuestion(questionId: string) {
    const ok = await confirm({
      title: "حذف السؤال؟",
      confirmLabel: "حذف",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/questions/${questionId}`, { method: "DELETE" });
    setQuestionCount((c) => Math.max(0, c - 1));
    toast("تم حذف السؤال", "success");
    router.refresh();
  }

  async function handleSaveToBank(questionId: string) {
    setSavingToBankId(questionId);
    const res = await fetch(`/api/teacher/questions/${questionId}/save-to-bank`, {
      method: "POST",
    });
    setSavingToBankId(null);
    if (res.ok) {
      toast("تم حفظ السؤال في بنك الأسئلة", "success");
    } else {
      const data = await res.json().catch(() => null);
      toast(data?.error ?? "تعذر حفظ السؤال في البنك", "error");
    }
  }

  async function handleCloneExam() {
    setCloning(true);
    const res = await fetch(`/api/teacher/exams/${exam.id}/clone`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setCloning(false);
    if (!res.ok) {
      toast(data?.error ?? "تعذر استنساخ الامتحان", "error");
      return;
    }
    toast("تم استنساخ الامتحان كمسودة جديدة", "success");
    router.push(`/teacher/exams/${data.exam.id}`);
    router.refresh();
  }

  async function handleAddFromBank(bankQuestionIds: string[]) {
    const res = await fetch(`/api/teacher/exams/${exam.id}/questions/from-bank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankQuestionIds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "تعذر إضافة الأسئلة من البنك";
    }
    const data = await res.json();
    setShowBankPicker(false);
    setQuestionCount((c) => c + (data.questions?.length ?? 0));
    toast(`تمت إضافة ${data.questions?.length ?? 0} سؤال من البنك`, "success");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Icon name="clock" size={14} /> {exam.durationMinutes} دقيقة</span>
              <span className="flex items-center gap-1"><Icon name="users" size={14} /> عدد المحاولات: {exam.maxTabViolations}</span>
              <span className="flex items-center gap-1"><Icon name="clockHistory" size={14} /> {exam.shuffleQuestions ? "أسئلة عشوائية" : "أسئلة بترتيب ثابت"}</span>
              <span className="flex items-center gap-1"><Icon name="clockHistory" size={14} /> {exam.shuffleChoices ? "خيارات عشوائية" : "خيارات بترتيب ثابت"}</span>
            </p>
            {exam.description && <p className="mt-1 text-sm text-slate-600">{exam.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                isPublished ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-green hover:bg-brand-green-dark"
              }`}
            >
              <Icon name="check" size={14} />
              {isPublished ? "إلغاء النشر" : "نشر الامتحان"}
            </button>
            {publishError && <p className="text-xs text-red-600">{publishError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloneExam}
                disabled={cloning}
                className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-60"
              >
                {cloning ? "جارٍ الاستنساخ..." : "استنساخ كامتحان جديد"}
              </button>
              <button
                onClick={handleDeleteExam}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                حذف الامتحان
              </button>
            </div>
          </div>
        </div>
      </div>

      <ExamScheduleEditor
        examId={exam.id}
        initialOpensAt={exam.opensAt}
        initialClosesAt={exam.closesAt}
      />

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Icon name="clipboard" size={17} className="text-brand-blue" />
            الأسئلة ({exam.questions.length})
          </h2>
          <div className="flex items-center gap-4">
            {!showBankPicker && (
              <button
                onClick={() => setShowBankPicker(true)}
                className="flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline"
              >
                <Icon name="folder" size={14} />
                إضافة من بنك الأسئلة
              </button>
            )}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-sm font-medium text-brand-blue hover:underline"
              >
                + إضافة سؤال
              </button>
            )}
          </div>
        </div>

        {showBankPicker && (
          <div className="mt-4">
            <BankQuestionPicker onAdd={handleAddFromBank} onCancel={() => setShowBankPicker(false)} />
          </div>
        )}

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
            <div key={q.id} className="rounded-xl bg-brand-panel/40 p-4">
              {editingId === q.id ? (
                <QuestionForm
                  submitLabel="حفظ التعديلات"
                  initial={{
                    type: q.type,
                    text: q.text,
                    points: q.points,
                    correctAnswer: q.correctAnswer ?? "",
                    imageUrl: q.imageUrl ?? "",
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
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
                    <img
                      src={q.imageUrl}
                      alt="صورة السؤال"
                      className="mt-2 max-h-32 rounded-lg border border-slate-200 object-contain"
                    />
                  )}
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
                      className="font-medium text-brand-blue hover:underline"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleSaveToBank(q.id)}
                      disabled={savingToBankId === q.id}
                      className="font-medium text-slate-600 hover:underline disabled:opacity-60"
                    >
                      {savingToBankId === q.id ? "جارٍ الحفظ..." : "حفظ في البنك"}
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
