import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

export default async function DashboardPage() {
  const teacherId = await requireTeacherId();

  const exams = await prisma.exam.findMany({
    where: { teacherId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true, codes: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/exams/new"
          className="rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          + امتحان جديد
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-dark">امتحاناتي</h1>
          <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-white p-12 text-center shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/illustrations/empty-exams.png" alt="" className="h-40 w-auto" />
          <div>
            <p className="font-semibold text-slate-700">لا توجد امتحانات بعد</p>
            <p className="mt-1 text-sm text-slate-500">ابدأ بإنشاء أول امتحان لتنظيم وإدارة اختباراتك بسهولة</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/teacher/exams/${exam.id}`}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{exam.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    exam.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {exam.isPublished ? "منشور" : "مسودة"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{exam.durationMinutes} دقيقة</p>
              <div className="mt-4 flex gap-4 text-sm text-slate-600">
                <span>{exam._count.questions} سؤال</span>
                <span>{exam._count.codes} رمز دخول</span>
                <span>{exam._count.attempts} محاولة</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
