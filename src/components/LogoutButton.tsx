"use client";

import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

export default function LogoutButton() {
  const router = useRouter();
  const { confirm, toast } = useUI();

  async function handleLogout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/teacher/login");
    router.refresh();
  }

  async function handleLogoutAll() {
    const ok = await confirm({
      title: "تسجيل الخروج من كل الأجهزة",
      body: "سيتم إنهاء جميع الجلسات النشطة على كل الأجهزة والمتصفحات فوراً، وستحتاج لتسجيل الدخول من جديد هنا أيضاً.",
      confirmLabel: "تسجيل الخروج من الكل",
      cancelLabel: "إلغاء",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch("/api/teacher/logout-all", { method: "POST" });
    if (!res.ok) {
      toast("تعذر تنفيذ العملية، حاول مرة أخرى", "error");
      return;
    }
    router.push("/teacher/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLogoutAll}
        title="إنهاء كل الجلسات النشطة على كل الأجهزة"
        className="hidden items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 sm:flex"
      >
        <Icon name="laptop" size={16} />
        من خلال الأجهزة
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <Icon name="power" size={16} />
        تسجيل الخروج
      </button>
    </div>
  );
}
