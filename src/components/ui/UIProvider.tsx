"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

type UIContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  toast: (message: string, tone?: ToastTone) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}

type ConfirmState = ConfirmOptions & { resolve: (value: boolean) => void };

export default function UIProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...opts, resolve });
    });
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  function resolveConfirm(result: boolean) {
    confirmState?.resolve(result);
    setConfirmState(null);
  }

  return (
    <UIContext.Provider value={{ confirm, toast }}>
      {children}

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{confirmState.title}</h3>
            {confirmState.body && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{confirmState.body}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {confirmState.cancelLabel ?? "إلغاء"}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                autoFocus
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  confirmState.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmState.confirmLabel ?? "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
              t.tone === "success"
                ? "bg-green-600"
                : t.tone === "error"
                ? "bg-red-600"
                : "bg-slate-800"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  );
}
