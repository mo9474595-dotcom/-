import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeClassRanking } from "@/lib/ranking";
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

  const classes = await prisma.classSection.findMany({
    where: { teacherId, deletedAt: null },
    orderBy: { name: "asc" },
  });
  const classStats = await Promise.all(
    classes.map(async (cls) => {
      const ranking = await computeClassRanking(cls.id);
      const withOverall = ranking.filter((r): r is typeof r & { overallPct: number } => r.overallPct != null);
      const average = withOverall.length
        ? withOverall.reduce((s, r) => s + r.overallPct, 0) / withOverall.length
        : null;
      return { classSection: cls, studentCount: ranking.length, gradedCount: withOverall.length, average };
    })
  );
  const comparableClasses = classStats.filter((c) => c.average != null);
  const highestClassAvg = comparableClasses.length
    ? Math.max(...comparableClasses.map((c) => c.average!))
    : null;
  const lowestClassAvg = comparableClasses.length
    ? Math.min(...comparableClasses.map((c) => c.average!))
    : null;

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

      {classes.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">مقارنة الأداء بين الشعب</h2>
          <p className="mt-1 text-xs text-slate-500">
            المعدل العام الموزون لكل شعبة (امتحانات، درجات أخرى، مشاريع، حضور) بحسب أوزان تلك
            الشعبة.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {classStats
              .slice()
              .sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
              .map(({ classSection, studentCount, gradedCount, average }) => (
                <Link
                  key={classSection.id}
                  href={`/teacher/classes/${classSection.id}`}
                  className="block rounded-xl bg-brand-panel/40 p-4 transition hover:bg-brand-panel/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-medium text-slate-900">
                      {classSection.name}
                      {average != null && average === highestClassAvg && comparableClasses.length > 1 && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          الأعلى أداءً
                        </span>
                      )}
                      {average != null && average === lowestClassAvg && comparableClasses.length > 1 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          الأدنى أداءً
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-slate-500">
                      {gradedCount} من {studentCount} طالب لديهم درجات
                    </span>
                  </div>

                  {average != null ? (
                    <>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-brand-blue"
                          style={{ width: `${Math.min(100, Math.max(0, average))}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-600">المعدل العام: {round1(average)}%</p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">لا توجد درجات كافية بعد للمقارنة</p>
                  )}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
