import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Icon from "@/components/brand/Icon";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default async function StatisticsPage() {
  const teacherId = await requireTeacherId();

  const exams = await prisma.exam.findMany({
    where: { teacherId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      attempts: {
        where: { status: { not: "IN_PROGRESS" } },
        select: { score: true, maxScore: true },
      },
    },
  });

  const examStats = exams.map((exam) => {
    const percents = exam.attempts
      .filter((a): a is typeof a & { maxScore: number } => !!a.maxScore && a.maxScore > 0)
      .map((a) => ((a.score ?? 0) / a.maxScore) * 100);
    const count = percents.length;
    const average = count ? percents.reduce((s, p) => s + p, 0) / count : null;
    const highest = count ? Math.max(...percents) : null;
    const lowest = count ? Math.min(...percents) : null;
    return { exam, count, average, highest, lowest, percents };
  });

  const allPercents = examStats.flatMap((es) => es.percents);
  const totalAttempts = allPercents.length;
  const overallAverage = totalAttempts
    ? allPercents.reduce((s, p) => s + p, 0) / totalAttempts
    : null;
  const examsWithData = examStats.filter((es) => es.count > 0).length;

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        <Icon name="scale" size={22} className="text-brand-blue" />
        الإحصائيات
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        نظرة عامة على أداء الطلاب عبر جميع امتحاناتك المنشورة.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">امتحانات لديها نتائج</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy-dark">{examsWithData}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">إجمالي المحاولات المكتملة</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy-dark">{totalAttempts}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">المعدل العام</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy-dark">
            {overallAverage === null ? "—" : `${round1(overallAverage)}%`}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">الأداء حسب الامتحان</h2>

        {examStats.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-slate-500">لا توجد امتحانات بعد.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {examStats.map(({ exam, count, average, highest, lowest }) => (
              <Link
                key={exam.id}
                href={`/teacher/exams/${exam.id}/results`}
                className="block rounded-xl bg-brand-panel/40 p-4 transition hover:bg-brand-panel/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{exam.title}</p>
                  <span className="text-xs text-slate-500">
                    {count > 0 ? `${count} محاولة مكتملة` : "لا توجد محاولات مكتملة بعد"}
                  </span>
                </div>

                {count > 0 && (
                  <>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-brand-blue"
                        style={{ width: `${Math.min(100, Math.max(0, average ?? 0))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                      <span>المعدل: {round1(average ?? 0)}%</span>
                      <span>الأعلى: {round1(highest ?? 0)}%</span>
                      <span>الأدنى: {round1(lowest ?? 0)}%</span>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
