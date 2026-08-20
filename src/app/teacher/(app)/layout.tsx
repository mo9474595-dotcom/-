import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTeacherIdFromSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

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
    select: { name: true },
  });
  if (!teacher) {
    redirect("/teacher/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/teacher/dashboard" className="text-lg font-bold text-slate-900">
              لوحة تحكم الأستاذ
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden text-sm text-slate-600 sm:inline">{teacher.name}</span>
              <LogoutButton />
            </div>
          </div>
          <nav className="mt-2 flex items-center gap-4 overflow-x-auto whitespace-nowrap text-sm font-medium text-slate-600 sm:mt-1">
            <Link href="/teacher/dashboard" className="hover:text-blue-600">
              الامتحانات
            </Link>
            <Link href="/teacher/classes" className="hover:text-blue-600">
              الشعب والطلاب
            </Link>
            <Link href="/teacher/audit-log" className="hover:text-blue-600">
              سجل التعديلات
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
