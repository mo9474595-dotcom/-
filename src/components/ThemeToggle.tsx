"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/brand/Icon";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // null until the post-hydration effect below reads the real value — the
  // server has no notion of the client's stored preference, so rendering
  // a placeholder until then avoids a hydration mismatch.
  const [dark, setDark] = useState<boolean | null>(null);

  // One-time read of client-only state (document.dataset) right after
  // mount, not a synchronization loop — deferring this is exactly what
  // avoids the hydration mismatch described above.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be blocked (private mode, disabled cookies) — the
      // toggle still works for this page load, it just won't persist.
    }
  }

  // Render a same-size placeholder until mounted so the toggle's initial
  // icon (which depends on a value only known client-side) never flashes
  // the wrong state during hydration.
  if (dark === null) return <div className={`h-9 w-9 ${className}`} />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={dark ? "الوضع النهاري" : "الوضع الليلي"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ${className}`}
    >
      <Icon name={dark ? "sun" : "moon"} size={16} />
    </button>
  );
}
