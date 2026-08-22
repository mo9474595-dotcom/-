import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTeacherIdFromSession, isAdminEmail } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import TeacherNav from "@/components/TeacherNav";
import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";

export default async function TeacherAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teacherId = await getTeacherIdFromSession();
  if (!teacherId) {
    redirect("/teacher/login");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true, email: true },
  });
  if (!teacher) {
    redirect("/teacher/login");
  }

  const isAdmin = isAdminEmail(teacher.email);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-brand-page-tint">
      <AppHeader title="لوحة تحكم الأستاذ" icon={<Icon name="home" size={18} />} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/teacher/dashboard" className="text-lg font-bold text-slate-900">
              لوحة تحكم الأستاذ
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">{teacher.name}</p>
                <p className="text-xs text-slate-500">أستاذ تدريسي</p>
              </div>
              <LogoutButton />
            </div>
          </div>
          <TeacherNav isAdmin={isAdmin} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
