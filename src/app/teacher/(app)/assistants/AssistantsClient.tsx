"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

type Assistant = { id: string; name: string; email: string; createdAt: string | Date };

export default function AssistantsClient({
  initialAssistants,
}: {
  initialAssistants: Assistant[];
}) {
  const router = useRouter();
  const { confirm, toast } = useUI();
  const [assistants, setAssistants] = useState(initialAssistants);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justCreated, setJustCreated] = useState<{ email: string; password: string } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/teacher/assistants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "تعذر إنشاء حساب المساعد");
      return;
    }
    setAssistants((prev) => [data.assistant, ...prev]);
    setJustCreated({ email, password });
    setName("");
    setEmail("");
    setPassword("");
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string, assistantName: string) {
    const ok = await confirm({
      title: "إزالة المساعد؟",
      body: `سيفقد ${assistantName} صلاحية الوصول فوراً.`,
      confirmLabel: "إزالة",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/teacher/assistants/${id}`, { method: "DELETE" });
    setAssistants((prev) => prev.filter((a) => a.id !== id));
    toast("تمت إزالة المساعد", "success");
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {justCreated && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">تم إنشاء حساب المساعد بنجاح</p>
          <p className="mt-1 text-sm text-green-700">
            شارك بيانات الدخول هذه مع المساعد مباشرة — لن تظهر كلمة المرور مرة أخرى بعد إغلاق
            هذه الرسالة. يسجّل الدخول من صفحة تسجيل دخول الأستاذ العادية.
          </p>
          <div className="mt-3 flex flex-col gap-1 rounded-lg bg-white p-3 font-mono text-sm">
            <span>البريد: {justCreated.email}</span>
            <span>كلمة المرور: {justCreated.password}</span>
          </div>
          <button
            onClick={() => setJustCreated(null)}
            className="mt-3 text-xs font-medium text-green-700 hover:underline"
          >
            إغلاق
          </button>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="self-start rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          + إضافة مساعد جديد
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">الاسم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-600">كلمة مرور مؤقتة</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
            >
              {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">المساعدون الحاليون ({assistants.length})</h2>
        {assistants.length === 0 ? (
          <p className="mt-4 py-6 text-center text-sm text-slate-500">لا يوجد مساعدون بعد.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {assistants.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-brand-panel/40 p-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.email}</p>
                </div>
                <button
                  onClick={() => handleDelete(a.id, a.name)}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                >
                  <Icon name="trash" size={13} />
                  إزالة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
