"use client";

import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";

export default function DeleteClassButton({ classId }: { classId: string }) {
  const router = useRouter();
  const { confirm, toast } = useUI();

  async function handleDelete() {
    const ok = await confirm({
      title: "حذف الشعبة",
      body: "ستُنقل هذه الشعبة إلى سلة المحذوفات ولن تظهر في قائمتك، ويمكنك استعادتها لاحقاً منها.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
      danger: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/teacher/classes/${classId}`, { method: "DELETE" });
    if (!res.ok) {
      toast("تعذر حذف الشعبة", "error");
      return;
    }
    toast("تم نقل الشعبة إلى سلة المحذوفات", "success");
    router.push("/teacher/classes");
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-xs font-medium text-red-600 hover:underline">
      حذف الشعبة
    </button>
  );
}
