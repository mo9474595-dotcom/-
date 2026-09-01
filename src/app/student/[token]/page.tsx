import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeClassRanking } from "@/lib/ranking";
import QuickJoinButton from "@/components/QuickJoinButton";
import ScoreFraction from "@/components/ScoreFraction";
import Icon from "@/components/brand/Icon";
import OrgLogo from "@/components/brand/OrgLogo";
import ThemeToggle from "@/components/ThemeToggle";

const attendanceStatusLabels: Record<string, string> = {
  PRESENT: "حاضر",
  LATE: "متأخر",
  ABSENT: "غائب",
  EXCUSED: "معذور",
};

function pct(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

export default async function StudentPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { portalToken: token },
    include: {
      classSection: true,
      manualGrades: { orderBy: { gradedAt: "desc" } },
      projectGrades: { include: { project: true } },
      attendanceRecords: { include: { session: true }, orderBy: { session: { date: "desc" } } },
      examCodes: {
        include: { exam: true, attempt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!student) notFound();

  // Fire-and-forget usage tracking so the teacher can notice if a link is
  // being accessed unusually often (a sign it may have been shared around).
  prisma.studentProfile
    .update({
      where: { id: student.id },
      data: { portalAccessCount: { increment: 1 }, portalLastAccessAt: new Date() },
    })
    .catch(() => {});

  const ranking = await computeClassRanking(student.classSectionId);
  const position = ranking.findIndex((r) => r.studentId === student.id);
  const breakdown = position >= 0 ? ranking[position] : null;

  const now = new Date();
  const eligibleExams = student.examCodes.filter(
    (c) => c.exam.isPublished && (!c.attempt || c.attempt.status === "IN_PROGRESS")
  );
  // An already-started attempt can always be continued regardless of the
  // opens/closes window — that window only gates the initial join.
  const availableExams = eligibleExams.filter(
    (c) =>
      c.attempt?.status === "IN_PROGRESS" ||
      ((!c.exam.opensAt || c.exam.opensAt <= now) && (!c.exam.closesAt || c.exam.closesAt >= now))
  );
  const upcomingExams = eligibleExams.filter(
    (c) => !c.attempt && c.exam.opensAt && c.exam.opensAt > now
  );
  const finishedExams = student.examCodes.filter(
    (c) => c.attempt && c.attempt.status !== "IN_PROGRESS"
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <OrgLogo size={48} />
          <div>
            <h1 className="text-2xl font-bold text-brand-navy-dark dark:text-slate-100">
              أهلاً {student.fullName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{student.classSection.name}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {breakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-brand-panel p-4 text-center dark:bg-slate-800">
            <p className="text-xs text-brand-navy-dark dark:text-blue-300">ترتيبك في الشعبة</p>
            <p className="mt-1 text-xl font-bold text-brand-navy-dark dark:text-slate-100">
              {position + 1} من {ranking.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">المعدل العام</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{pct(breakdown.overallPct)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">الحضور</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{pct(breakdown.attendancePct)}</p>
          </div>
        </div>
      )}

      {availableExams.length > 0 && (
        <div className="rounded-2xl bg-brand-panel p-5 dark:bg-slate-800">
          <h2 className="flex items-center gap-2 font-semibold text-brand-navy-dark dark:text-slate-100">
            <Icon name="clipboard" size={17} />
            امتحانات متاحة لك
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {availableExams.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{c.exam.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.exam.durationMinutes} دقيقة</p>
                </div>
                <QuickJoinButton
                  code={c.code}
                  studentName={student.fullName}
                  studentRef={student.studentRef}
                  label={c.attempt ? "متابعة الامتحان" : "ابدأ الامتحان"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingExams.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Icon name="calendarCheck" size={17} className="text-brand-blue dark:text-blue-400" />
            امتحاناتي القادمة
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {upcomingExams.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-brand-panel/40 p-3 dark:bg-slate-700/40"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{c.exam.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.exam.durationMinutes} دقيقة</p>
                </div>
                <div className="text-left">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    يفتح في {new Date(c.exam.opensAt!).toLocaleString("ar", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <Icon name="scale" size={17} className="text-brand-blue dark:text-blue-400" />
          نتائج الامتحانات
        </h2>
        {finishedExams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">لا توجد نتائج بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {finishedExams.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-2 py-2 dark:text-slate-200">{c.exam.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600 dark:text-slate-400">
                    <ScoreFraction score={c.attempt!.score} max={c.attempt!.maxScore} />
                  </td>
                  <td className="px-2 py-2 text-left">
                    {c.exam.resultsPublished && (
                      <Link
                        href={`/student/${token}/review/${c.attempt!.id}`}
                        className="text-xs font-medium text-brand-blue hover:underline dark:text-blue-400"
                      >
                        عرض التفاصيل
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <Icon name="bulb" size={17} className="text-brand-blue dark:text-blue-400" />
          درجات أخرى ومشاريع
        </h2>
        {student.manualGrades.length === 0 && student.projectGrades.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">لا توجد درجات بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {student.manualGrades.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-2 py-2 dark:text-slate-200">{g.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600 dark:text-slate-400">
                    <ScoreFraction score={g.score} max={g.maxScore} />
                  </td>
                </tr>
              ))}
              {student.projectGrades.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-2 py-2 dark:text-slate-200">{g.project.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600 dark:text-slate-400">
                    <ScoreFraction score={g.score} max={g.project.maxScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <Icon name="calendarCheck" size={17} className="text-brand-blue dark:text-blue-400" />
          سجل الحضور
        </h2>
        {student.attendanceRecords.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">لا يوجد سجل حضور بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {student.attendanceRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-2 py-2 dark:text-slate-200">
                    {r.session.title || new Date(r.session.date).toLocaleDateString("ar")}
                  </td>
                  <td className="px-2 py-2 text-left text-slate-600 dark:text-slate-400">
                    {attendanceStatusLabels[r.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
