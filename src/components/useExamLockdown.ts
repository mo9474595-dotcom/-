"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CheatEventType =
  | "TAB_HIDDEN"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CONTEXT_MENU"
  | "DEVTOOLS_SUSPECTED"
  | "SHORTCUT_BLOCKED"
  | "SCREEN_RECORDING_SUSPECTED";

const LABELS: Record<CheatEventType, string> = {
  TAB_HIDDEN: "تم رصد مغادرتك للصفحة",
  WINDOW_BLUR: "تم رصد خروجك من نافذة الامتحان",
  FULLSCREEN_EXIT: "الرجاء العودة إلى وضع الشاشة الكاملة",
  COPY_ATTEMPT: "النسخ غير مسموح خلال الامتحان",
  PASTE_ATTEMPT: "اللصق غير مسموح خلال الامتحان",
  CONTEXT_MENU: "القائمة المنسدلة غير مسموحة خلال الامتحان",
  DEVTOOLS_SUSPECTED: "تم رصد اشتباه بفتح أدوات المطور",
  SHORTCUT_BLOCKED: "هذا الاختصار غير مسموح خلال الامتحان",
  SCREEN_RECORDING_SUSPECTED: "تم رصد اشتباه بتسجيل الشاشة",
};

// DOM/global-scope markers that popular browser-based screen recorders
// leave behind while active. Best-effort only: a native OS recorder (Game
// Bar, QuickTime, OBS) or an extension running in an isolated content-script
// world is invisible to page JS — there's no browser API that exposes
// "something outside this tab is capturing it." This only catches
// recorders that inject into the page itself.
const RECORDER_DOM_SELECTOR =
  '[id*="loom" i], [class*="loom" i], [id*="screencastify" i], [class*="screencastify" i], ' +
  '[id*="nimbus-capture" i], [class*="nimbus-capture" i], [id*="vidyard" i], [class*="vidyard" i], ' +
  '[id*="awesome-screenshot" i], [class*="awesome-screenshot" i], [id*="loom-companion" i]';

/**
 * Client-side deterrent layer. None of this is airtight (a phone camera or
 * a second device defeats it entirely) — it raises the cost of casual
 * cheating and, more importantly, reports every attempt to the server so
 * the teacher sees it. The server-side deadline and single-session lock in
 * attempt-guard.ts are what actually can't be bypassed from the browser.
 */
export function useExamLockdown(
  attemptId: string,
  active: boolean,
  onTerminated: () => void
) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const warningTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminatedRef = useRef(false);

  const report = useCallback(
    async (type: CheatEventType, detail?: string) => {
      if (terminatedRef.current) return;
      try {
        const res = await fetch(`/api/exam/${attemptId}/cheat-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, detail }),
        });
        const data = await res.json().catch(() => null);
        if (data && typeof data.tabViolations === "number") {
          setViolations(data.tabViolations);
        }
        if (data?.status === "TERMINATED") {
          terminatedRef.current = true;
          onTerminated();
          return;
        }
        setWarning(LABELS[type]);
        if (warningTimeout.current) clearTimeout(warningTimeout.current);
        warningTimeout.current = setTimeout(() => setWarning(null), 3500);
      } catch {
        // Network hiccup — don't block the exam UI over a failed report.
      }
    },
    [attemptId, onTerminated]
  );

  useEffect(() => {
    if (!active) return;

    function onVisibility() {
      if (document.hidden) report("TAB_HIDDEN");
    }
    function onBlur() {
      report("WINDOW_BLUR");
    }
    function onFullscreenChange() {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (!fs) report("FULLSCREEN_EXIT");
    }
    function onCopy(e: ClipboardEvent) {
      e.preventDefault();
      report("COPY_ATTEMPT");
    }
    function onCut(e: ClipboardEvent) {
      e.preventDefault();
      report("COPY_ATTEMPT");
    }
    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      report("PASTE_ATTEMPT");
    }
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      report("CONTEXT_MENU");
    }
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      const blocked =
        key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "K"].includes(key)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(key)) ||
        (e.ctrlKey && ["U", "S", "P"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && key === "C") ||
        ((e.ctrlKey || e.metaKey) && key === "V");
      if (blocked) {
        e.preventDefault();
        report("SHORTCUT_BLOCKED", e.key);
      }
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Heuristic-only: a docked devtools panel shrinks the viewport relative
    // to the outer window. Threshold is generous to avoid false positives
    // from normal browser chrome / zoom.
    const devtoolsInterval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 220 || heightDiff > 220) {
        report("DEVTOOLS_SUSPECTED");
      }
    }, 4000);

    // Catches a screen-recording extension that injects itself into the
    // page (Loom, Screencastify, Nimbus Capture, etc.) by scanning for the
    // DOM footprint it leaves while recording.
    const recorderScanInterval = setInterval(() => {
      if (document.querySelector(RECORDER_DOM_SELECTOR)) {
        report("SCREEN_RECORDING_SUSPECTED", "recorder-dom-marker");
      }
    }, 5000);

    // Catches an in-page script invoking the Screen Capture API against
    // this tab. Wrapped in a try/catch since some browsers expose
    // mediaDevices only on secure origins.
    let restoreGetDisplayMedia: (() => void) | null = null;
    try {
      const mediaDevices = navigator.mediaDevices as
        | (MediaDevices & { getDisplayMedia?: (...args: unknown[]) => Promise<MediaStream> })
        | undefined;
      const original = mediaDevices?.getDisplayMedia;
      if (mediaDevices && original) {
        mediaDevices.getDisplayMedia = function patchedGetDisplayMedia(...args: unknown[]) {
          report("SCREEN_RECORDING_SUSPECTED", "getDisplayMedia-called");
          return original.apply(mediaDevices, args);
        };
        restoreGetDisplayMedia = () => {
          mediaDevices.getDisplayMedia = original;
        };
      }
    } catch {
      // Screen Capture API unavailable in this browser/context — nothing to patch.
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearInterval(devtoolsInterval);
      clearInterval(recorderScanInterval);
      restoreGetDisplayMedia?.();
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
    };
  }, [active, report]);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Some browsers/OS block fullscreen (e.g. iOS Safari) — the exam
      // still works, just without that particular layer of deterrence.
    }
  }, []);

  return { violations, warning, isFullscreen, enterFullscreen };
}
