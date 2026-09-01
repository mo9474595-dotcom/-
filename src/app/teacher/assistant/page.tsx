import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId, resolveScopeTeacherId } from "@/lib/auth";
import Icon from "@/components/brand/Icon";

export default async function AssistantDashboardPage() {
  const teacherId = await requireTeacherId();
  const ownerId = await resolveScopeTeacherId(teacherId);
  if (ownerId === teacherId) redirect("/teacher/dashboard");

  const exams = await prisma.exam.findMany({
    where: { teacherId: ownerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-dark">امتحانات الأستاذ</h1>
      <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        يمكنك عرض النتائج وتصحيح الأسئلة ذات الإجابة القصيرة. لا يمكنك حذف أو تعديل إعدادات
        الامتحان.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/teacher/assistant/exams/${exam.id}/results`}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm transition hover:bg-brand-panel/40"
          >
            <div>
              <p className="font-medium text-slate-900">{exam.title}</p>
              <p className="text-xs text-slate-500">{exam._count.attempts} محاولة</p>
            </div>
            <Icon name="clipboard" size={18} className="text-brand-blue" />
          </Link>
        ))}
        {exams.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            لا توجد امتحانات بعد.
          </p>
        )}
      </div>
    </div>
  );
}
