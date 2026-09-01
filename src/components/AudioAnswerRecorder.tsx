"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";

const MAX_RECORDING_MS = 120_000; // 2 minutes — plenty for a spoken answer, keeps the data: URL well under the server's cap.

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذرت معالجة التسجيل"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/** Records a short spoken answer via the browser mic for an AUDIO_ANSWER
 * question — a controlled component: `value` is the saved data: URL (or
 * undefined), `onChange` is called with a new one once recording stops. */
export default function AudioAnswerRecorder({
  value,
  onChange,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (tickRef.current) clearInterval(tickRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("متصفحك لا يدعم تسجيل الصوت");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
          const dataUrl = await blobToDataUrl(blob);
          onChange(dataUrl);
        } catch (e) {
          setError(e instanceof Error ? e.message : "تعذر حفظ التسجيل");
        } finally {
          setBusy(false);
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 250);
      stopTimeoutRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      setError("تعذر الوصول إلى الميكروفون — تأكد من السماح بالإذن");
    }
  }

  function stopRecording() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    recorderRef.current?.stop();
    setRecording(false);
  }

  function formatSeconds(ms: number) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {value && !recording && (
        <audio controls src={value} className="w-full" />
      )}

      <div className="flex items-center gap-3">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
            إيقاف التسجيل ({formatSeconds(elapsedMs)})
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
          >
            <Icon name="headset" size={14} />
            {busy ? "جارٍ الحفظ..." : value ? "إعادة التسجيل" : "بدء التسجيل"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        الحد الأقصى للتسجيل دقيقتان — يمكنك إعادة التسجيل قبل تسليم الامتحان.
      </p>
    </div>
  );
}
