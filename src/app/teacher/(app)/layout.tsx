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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/teacher/dashboard" className="text-lg font-bold text-slate-900">
            لوحة تحكم الأستاذ
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{teacher.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
