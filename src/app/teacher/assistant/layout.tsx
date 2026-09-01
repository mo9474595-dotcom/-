import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherIdFromSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";

export default async function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getTeacherIdFromSession();
  if (!teacherId) redirect("/teacher/login");

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true, ownerId: true, owner: { select: { name: true } } },
  });
  if (!teacher) redirect("/teacher/login");
  // A regular teacher account has no business in the assistant area — send
  // them back to their own dashboard instead.
  if (!teacher.ownerId) redirect("/teacher/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-brand-page-tint">
      <AppHeader title="لوحة المساعد" icon={<Icon name="users" size={18} />} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{teacher.name}</p>
            <p className="text-xs text-slate-500">
              مساعد لدى {teacher.owner?.name ?? "—"} — صلاحية التصحيح ومتابعة النتائج فقط
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
