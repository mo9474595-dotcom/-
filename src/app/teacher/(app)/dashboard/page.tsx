import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

export default async function DashboardPage() {
  const teacherId = await requireTeacherId();

  const exams = await prisma.exam.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true, codes: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">امتحاناتي</h1>
        <Link
          href="/teacher/exams/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + امتحان جديد
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          لا توجد امتحانات بعد. ابدأ بإنشاء أول امتحان.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/teacher/exams/${exam.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
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
