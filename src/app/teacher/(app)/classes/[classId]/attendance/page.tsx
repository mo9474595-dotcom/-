import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import AttendanceSessionsClient from "./AttendanceSessionsClient";

export default async function AttendanceListPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId } = await params;

  const classSection = await prisma.classSection.findUnique({ where: { id: classId } });
  if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) notFound();

  const sessions = await prisma.attendanceSession.findMany({
    where: { classSectionId: classId },
    orderBy: { date: "desc" },
    include: { records: { select: { status: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">حضور {classSection.name}</h1>
      <AttendanceSessionsClient classId={classId} initialSessions={sessions} />
    </div>
  );
}
