"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamLockdown } from "@/components/useExamLockdown";
import { useUI } from "@/components/ui/UIProvider";
import type { ApiQuestion, ExamStateResponse } from "@/lib/exam-client-types";
import Icon from "@/components/brand/Icon";
import ThemeToggle from "@/components/ThemeToggle";

type Phase = "intro" | "loading" | "active" | "submitting" | "done" | "error";

type LocalAnswer = { selectedChoiceId?: string; textAnswer?: string };

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const TIME_WARNING_MS = 5 * 60_000;

type SaveStatus = "saving" | "saved" | "error";

function playBeep() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Some browsers block audio without a fresh user gesture — the visual
    // warning still shows either way, so a failed beep is harmless to ignore.
  }
}

export default function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const { confirm, toast } = useUI();

  const [phase, setPhase] = useState<Phase>("intro");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Debounced saves that haven't fired yet, keyed by question id — flushed
  // immediately before submit so a fast "select answer, then submit" click
  // sequence (very plausible on a single- or last-question exam) can't lose
  // the last answer to the 500ms debounce window.
  const pendingSaves = useRef<Record<string, () => Promise<void>>>({});
  const inFlightSaves = useRef<Set<Promise<void>>>(new Set());
  // Answers whose save request failed (network drop, mainly) — retried
  // automatically once the connection comes back, rather than silently lost.
  const failedAnswers = useRef<Record<string, LocalAnswer>>({});
  const timeWarnedRef = useRef(false);

  const handleTerminated = useCallback(() => {
    setPhase("done");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const { violations, warning, enterFullscreen } = useExamLockdown(
    attemptId,
    phase === "active",
    handleTerminated
  );

  const loadState = useCallback(async () => {
    const res = await fetch(`/api/exam/${attemptId}/state`);
    const data: ExamStateResponse & { error?: string } = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "تعذر تحميل الامتحان");
      setPhase("error");
      return;
    }
    setExamTitle(data.exam.title);
    if (data.status !== "IN_PROGRESS") {
      setPhase("done");
      return;
    }
    setQuestions(data.questions ?? []);
    const initialAnswers: Record<string, LocalAnswer> = {};
    for (const q of data.questions ?? []) {
      initialAnswers[q.id] = {
        selectedChoiceId: q.savedSelectedChoiceId ?? undefined,
        textAnswer: q.savedTextAnswer ?? undefined,
      };
    }
    setAnswers(initialAnswers);
    setDeadline(new Date(data.deadlineAt!).getTime());
    setPhase("active");
  }, [attemptId]);

  async function handleStart() {
    setPhase("loading");
    await enterFullscreen();
    await loadState();
  }

  const flushPendingSaves = useCallback(async () => {
    for (const timer of Object.values(saveTimers.current)) clearTimeout(timer);
    saveTimers.current = {};
    const fns = Object.values(pendingSaves.current);
    pendingSaves.current = {};
    await Promise.all(fns.map((fn) => fn()));
    await Promise.all(Array.from(inFlightSaves.current));
    // Retry any answer whose save already failed once (e.g. a dropped
    // connection) so a submit can't silently finalize without it.
    const retryEntries = Object.entries(failedAnswers.current);
    await Promise.all(retryEntries.map(([qId, ans]) => doSave(qId, ans)));
    // doSave is a stable function declaration (attemptId/refs/setters only)
    // re-created each render but functionally identical — omitted to avoid
    // pointlessly invalidating this callback's identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = useCallback(async () => {
    setPhase("submitting");
    await flushPendingSaves();
    await fetch(`/api/exam/${attemptId}/submit`, { method: "POST" });
    setPhase("done");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [attemptId, flushPendingSaves]);

  // Countdown ticker; server is authoritative, this is just the display.
  useEffect(() => {
    if (phase !== "active" || deadline == null) return;
    const tick = () => {
      const rem = deadline - Date.now();
      setRemainingMs(rem);
      if (rem <= 0) {
        submit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, deadline, submit]);

  useEffect(() => {
    if (phase === "done") router.replace(`/exam/${attemptId}/submitted`);
  }, [phase, attemptId, router]);

  // Warn once (visually + a short beep) the first time remaining time drops
  // to the threshold — not on every tick after, and not a hard requirement
  // the student act on immediately (the countdown itself stays authoritative).
  useEffect(() => {
    if (
      phase === "active" &&
      remainingMs != null &&
      remainingMs <= TIME_WARNING_MS &&
      !timeWarnedRef.current
    ) {
      timeWarnedRef.current = true;
      toast("تبقّى أقل من 5 دقائق على انتهاء الامتحان!", "error");
      playBeep();
    }
  }, [phase, remainingMs, toast]);

  // Track connectivity so a dropped connection shows a clear state instead
  // of answers silently failing to save.
  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
      retryFailedSaves();
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retryFailedSaves() {
    const entries = Object.entries(failedAnswers.current);
    for (const [questionId, answer] of entries) {
      doSave(questionId, answer);
    }
  }

  function doSave(questionId: string, answer: LocalAnswer): Promise<void> {
    setSaveStatus((s) => ({ ...s, [questionId]: "saving" }));
    const p = fetch(`/api/exam/${attemptId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, ...answer }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        delete failedAnswers.current[questionId];
        setSaveStatus((s) => ({ ...s, [questionId]: "saved" }));
      })
      .catch(() => {
        failedAnswers.current[questionId] = answer;
        setSaveStatus((s) => ({ ...s, [questionId]: "error" }));
      });
    inFlightSaves.current.add(p);
    p.finally(() => inFlightSaves.current.delete(p));
    return p;
  }

  function scheduleSave(questionId: string, answer: LocalAnswer) {
    if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
    pendingSaves.current[questionId] = () => doSave(questionId, answer);
    saveTimers.current[questionId] = setTimeout(() => {
      delete pendingSaves.current[questionId];
      doSave(questionId, answer);
    }, 500);
  }

  function setChoice(questionId: string, choiceId: string) {
    const next = { selectedChoiceId: choiceId };
    setAnswers((a) => ({ ...a, [questionId]: next }));
    scheduleSave(questionId, next);
  }

  function setText(questionId: string, text: string) {
    const next = { textAnswer: text };
    setAnswers((a) => ({ ...a, [questionId]: next }));
    scheduleSave(questionId, next);
  }

  if (phase === "intro") {
    return (
      <div className="relative flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue dark:bg-slate-700 dark:text-blue-300">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-xl font-bold text-brand-navy-dark dark:text-slate-100">قبل أن تبدأ</h1>
          <ul className="mt-4 flex flex-col gap-2 text-right text-sm text-slate-600 dark:text-slate-400">
            <li>• سيدخل المتصفح في وضع الشاشة الكاملة إلزامياً.</li>
            <li>• الخروج من الصفحة أو التبويب أو الشاشة الكاملة يُسجَّل ويُبلَّغ للأستاذ.</li>
            <li>• النسخ واللصق والقائمة المنسدلة معطّلة طوال الامتحان.</li>
            <li>• الوقت يُحتسب من الخادم ولا يمكن إيقافه بإغلاق الصفحة.</li>
            <li>• تجاوز عدد معيّن من المخالفات ينهي الامتحان تلقائياً.</li>
            <li>• على بعض الأجهزة (كالآيفون والآيباد) قد لا يدعم المتصفح وضع الشاشة الكاملة إجبارياً — الامتحان يستمر بشكل طبيعي في هذه الحالة.</li>
          </ul>
          <button
            onClick={handleStart}
            className="mt-6 w-full rounded-full bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy"
          >
            ابدأ الامتحان بملء الشاشة
          </button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return <CenteredMessage text="جارٍ تحميل الامتحان..." />;
  }

  if (phase === "error") {
    return <CenteredMessage text={errorMsg ?? "حدث خطأ"} isError />;
  }

  if (phase === "submitting" || phase === "done") {
    return <CenteredMessage text="جارٍ تسليم الامتحان..." />;
  }

  const current = questions[index];
  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return a?.selectedChoiceId || (a?.textAnswer && a.textAnswer.trim().length > 0);
  }).length;

  return (
    <div className="exam-lockdown flex flex-1 flex-col bg-brand-page-tint dark:bg-slate-900">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono font-semibold ${
              remainingMs != null && remainingMs < 60_000
                ? "border-red-200 bg-red-50 text-red-700 animate-pulse dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                : remainingMs != null && remainingMs < TIME_WARNING_MS
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                : "border-blue-100 bg-brand-panel text-brand-blue dark:border-slate-600 dark:bg-slate-700 dark:text-blue-300"
            }`}
          >
            <Icon name="clock" size={16} />
            {remainingMs != null ? formatTime(remainingMs) : "--:--"}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {violations > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                مخالفات: {violations}
              </span>
            )}
            <h1 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">{examTitle}</h1>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {warning && (
        <div className="fixed inset-x-0 top-16 z-20 mx-auto w-full max-w-md rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {warning}
        </div>
      )}

      {!isOnline && (
        <div className="fixed inset-x-0 top-16 z-20 mx-auto w-full max-w-md rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          انقطع الاتصال بالإنترنت — إجاباتك محفوظة محلياً وستُرسَل تلقائياً عند عودة الاتصال
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-4 px-4 py-6">
        <div className="flex flex-wrap justify-center gap-2">
          {questions.map((q, i) => {
            const answered = Boolean(
              answers[q.id]?.selectedChoiceId || answers[q.id]?.textAnswer?.trim()
            );
            return (
              <button
                key={q.id}
                onClick={() => setIndex(i)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                  i === index
                    ? "bg-brand-blue text-white"
                    : answered
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          تم الإجابة على {answeredCount} من {questions.length}
        </p>

        {current && (
          <div className="w-full rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-panel px-3 py-1 text-xs font-medium text-brand-navy-dark dark:bg-slate-700 dark:text-blue-300">
                درجة {current.points}
              </span>
              <span className="rounded-full bg-brand-panel px-3 py-1 text-xs font-medium text-brand-navy-dark dark:bg-slate-700 dark:text-blue-300">
                سؤال {index + 1} من {questions.length}
              </span>
            </div>
            <p className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">{current.text}</p>
            {current.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data: URL, not an optimizable remote asset
              <img
                src={current.imageUrl}
                alt="صورة السؤال"
                className="mt-3 max-h-96 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
              />
            )}
            <SaveStatusBadge status={saveStatus[current.id]} />

            {current.type !== "SHORT_ANSWER" ? (
              <div className="mt-5 flex flex-col gap-2">
                {current.choices.map((c) => (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      answers[current.id]?.selectedChoiceId === c.id
                        ? "border-brand-blue bg-brand-panel dark:border-blue-500 dark:bg-slate-700"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name={current.id}
                      checked={answers[current.id]?.selectedChoiceId === c.id}
                      onChange={() => setChoice(current.id, c.id)}
                      className="accent-brand-blue"
                    />
                    <span className="dark:text-slate-200">{c.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[current.id]?.textAnswer ?? ""}
                onChange={(e) => setText(current.id, e.target.value)}
                rows={5}
                placeholder="اكتب إجابتك هنا..."
                className="mt-5 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/40"
              />
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
              >
                السابق ‹
              </button>
              {index < questions.length - 1 ? (
                <button
                  onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
                >
                  › التالي
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "تسليم الامتحان؟",
                      body: "لا يمكن التراجع عن هذا الإجراء بعد تسليم الامتحان.",
                      confirmLabel: "تسليم",
                      danger: true,
                    });
                    if (ok) submit();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-green-dark"
                >
                  <Icon name="save" size={14} />
                  تسليم الامتحان
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }: { status?: SaveStatus }) {
  if (!status) return null;
  if (status === "saving") {
    return <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">جارٍ الحفظ...</p>;
  }
  if (status === "error") {
    return (
      <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
        تعذر الحفظ، ستتم إعادة المحاولة تلقائياً
      </p>
    );
  }
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
      <Icon name="check" size={12} />
      تم الحفظ
    </p>
  );
}

function CenteredMessage({ text, isError }: { text: string; isError?: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <p
        className={`text-center text-lg ${
          isError ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
