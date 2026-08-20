import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeClassRanking } from "@/lib/ranking";
import QuickJoinButton from "@/components/QuickJoinButton";

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

  const ranking = await computeClassRanking(student.classSectionId);
  const position = ranking.findIndex((r) => r.studentId === student.id);
  const breakdown = position >= 0 ? ranking[position] : null;

  const availableExams = student.examCodes.filter(
    (c) => c.exam.isPublished && (!c.attempt || c.attempt.status === "IN_PROGRESS")
  );
  const finishedExams = student.examCodes.filter(
    (c) => c.attempt && c.attempt.status !== "IN_PROGRESS"
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">أهلاً {student.fullName}</h1>
        <p className="text-sm text-slate-500">{student.classSection.name}</p>
      </div>

      {breakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-xs text-blue-700">ترتيبك في الشعبة</p>
            <p className="mt-1 text-xl font-bold text-blue-900">
              {position + 1} من {ranking.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500">المعدل العام</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{pct(breakdown.overallPct)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs text-slate-500">الحضور</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{pct(breakdown.attendancePct)}</p>
          </div>
        </div>
      )}

      {availableExams.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-green-900">امتحانات متاحة لك</h2>
          <div className="mt-3 flex flex-col gap-3">
            {availableExams.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{c.exam.title}</p>
                  <p className="text-xs text-slate-500">{c.exam.durationMinutes} دقيقة</p>
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">نتائج الامتحانات</h2>
        {finishedExams.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا توجد نتائج بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {finishedExams.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2">{c.exam.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600">
                    {c.attempt!.score ?? "—"} / {c.attempt!.maxScore ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">درجات أخرى ومشاريع</h2>
        {student.manualGrades.length === 0 && student.projectGrades.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا توجد درجات بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {student.manualGrades.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2">{g.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600">
                    {g.score} / {g.maxScore}
                  </td>
                </tr>
              ))}
              {student.projectGrades.map((g) => (
                <tr key={g.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2">{g.project.title}</td>
                  <td className="px-2 py-2 text-left text-slate-600">
                    {g.score ?? "—"} / {g.project.maxScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">سجل الحضور</h2>
        {student.attendanceRecords.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">لا يوجد سجل حضور بعد.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {student.attendanceRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2">
                    {r.session.title || new Date(r.session.date).toLocaleDateString("ar")}
                  </td>
                  <td className="px-2 py-2 text-left text-slate-600">
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
