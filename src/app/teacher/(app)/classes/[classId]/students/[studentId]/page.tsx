import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { computeClassRanking } from "@/lib/ranking";
import ManualGradesManager from "./ManualGradesManager";
import PortalLinkBox from "./PortalLinkBox";
import ScoreFraction from "@/components/ScoreFraction";
import Icon from "@/components/brand/Icon";

const attendanceStatusLabels: Record<string, string> = {
  PRESENT: "حاضر",
  LATE: "متأخر",
  ABSENT: "غائب",
  EXCUSED: "معذور",
};

const attemptStatusLabels: Record<string, string> = {
  IN_PROGRESS: "قيد الحل",
  SUBMITTED: "تم التسليم",
  AUTO_SUBMITTED: "تسليم تلقائي",
  TERMINATED: "أُنهي (مخالفات)",
};

function pct(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

function qualityLabel(v: number | null) {
  if (v == null) return "—";
  if (v >= 90) return "ممتاز";
  if (v >= 75) return "جيد جداً";
  if (v >= 60) return "جيد";
  return "يحتاج متابعة";
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId, studentId } = await params;

  const classSection = await prisma.classSection.findUnique({ where: { id: classId } });
  if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) notFound();

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      manualGrades: { orderBy: { gradedAt: "desc" } },
      projectGrades: { include: { project: true } },
      attendanceRecords: { include: { session: true }, orderBy: { session: { date: "desc" } } },
      examCodes: {
        include: { exam: { select: { title: true } }, attempt: true },
      },
    },
  });
  if (!student || student.classSectionId !== classId) notFound();

  const ranking = await computeClassRanking(classId);
  const breakdown = ranking.find((r) => r.studentId === studentId) ?? null;

  const finishedExams = student.examCodes.filter((c) => c.attempt);

  const statCards: { label: string; value: number | null; icon: "calendarCheck" | "folder" | "bulb" | "clipboard" | "scale" }[] = [
    { label: "المعدل العام", value: breakdown?.overallPct ?? null, icon: "scale" },
    { label: "الامتحانات", value: breakdown?.examPct ?? null, icon: "clipboard" },
    { label: "درجات أخرى", value: breakdown?.manualPct ?? null, icon: "bulb" },
    { label: "المشاريع", value: breakdown?.projectPct ?? null, icon: "folder" },
    { label: "الحضور", value: breakdown?.attendancePct ?? null, icon: "calendarCheck" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/teacher/classes/${classId}`}
          className="text-sm font-medium text-brand-blue hover:underline"
        >
          العودة إلى ملف الطالب ‹ {classSection.name}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
            <Icon name="user" size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{student.fullName}</h1>
            {student.studentRef && (
              <p className="text-sm text-slate-500">الرقم الجامعي: {student.studentRef}</p>
            )}
          </div>
        </div>
      </div>

      <PortalLinkBox
        studentId={student.id}
        initialToken={student.portalToken}
        accessCount={student.portalAccessCount}
        lastAccessAt={student.portalLastAccessAt}
      />

      {breakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-slate-500">{item.label}</p>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
                  <Icon name={item.icon} size={13} />
                </span>
              </div>
              <p className="mt-1 text-xl font-bold text-brand-navy-dark">{pct(item.value)}</p>
              <p className="text-xs text-slate-400">{qualityLabel(item.value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="clipboard" size={17} className="text-brand-blue" />
          نتائج الامتحانات
        </h2>
        {finishedExams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لم يخض هذا الطالب أي امتحان بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="px-3 py-2 font-medium">الامتحان</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                <th className="px-3 py-2 font-medium">الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {finishedExams.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">{c.exam.title}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {attemptStatusLabels[c.attempt!.status]}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <ScoreFraction score={c.attempt!.score} max={c.attempt!.maxScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ManualGradesManager studentId={studentId} initialGrades={student.manualGrades} />

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="folder" size={17} className="text-brand-blue" />
          درجات المشاريع
        </h2>
        {student.projectGrades.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا توجد درجات مشاريع بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="px-3 py-2 font-medium">المشروع</th>
                <th className="px-3 py-2 font-medium">الدرجة</th>
              </tr>
            </thead>
            <tbody>
              {student.projectGrades.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">{g.project.title}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <ScoreFraction score={g.score} max={g.project.maxScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Icon name="calendarCheck" size={17} className="text-brand-blue" />
          سجل الحضور
        </h2>
        {student.attendanceRecords.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا يوجد سجل حضور بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-slate-500">
                <th className="px-3 py-2 font-medium">الجلسة</th>
                <th className="px-3 py-2 font-medium">التاريخ</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {student.attendanceRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">{r.session.title || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {new Date(r.session.date).toLocaleDateString("ar")}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {attendanceStatusLabels[r.status]}
                    {r.markedBySelf && " (تسجيل ذاتي)"}
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
