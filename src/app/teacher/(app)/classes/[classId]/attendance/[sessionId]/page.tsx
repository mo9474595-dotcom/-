import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import AttendanceMarkingClient from "./AttendanceMarkingClient";

export default async function AttendanceSessionPage({
  params,
}: {
  params: Promise<{ classId: string; sessionId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId, sessionId } = await params;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { classSection: true },
  });
  if (!session || session.classSection.teacherId !== teacherId || session.classSectionId !== classId) {
    notFound();
  }

  const [students, records] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { classSectionId: classId },
      orderBy: { fullName: "asc" },
    }),
    prisma.attendanceRecord.findMany({ where: { sessionId } }),
  ]);
  const recordByStudent = new Map(records.map((r) => [r.studentProfileId, r]));
  const rows = students.map((s) => ({ student: s, record: recordByStudent.get(s.id) ?? null }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        {session.title || "جلسة حضور"} — {new Date(session.date).toLocaleDateString("ar")}
      </h1>
      <AttendanceMarkingClient session={session} initialRows={rows} />
    </div>
  );
}
