import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { computeClassRanking } from "@/lib/ranking";
import RosterManager from "./RosterManager";
import WeightsEditor from "./WeightsEditor";
import RankingTable from "./RankingTable";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId } = await params;

  const classSection = await prisma.classSection.findUnique({
    where: { id: classId },
    include: {
      students: { orderBy: { fullName: "asc" } },
      _count: { select: { projects: true, attendanceSessions: true } },
    },
  });
  if (!classSection || classSection.teacherId !== teacherId) notFound();

  const ranking = await computeClassRanking(classId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{classSection.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/teacher/classes/${classId}/projects`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            المشاريع ({classSection._count.projects})
          </Link>
          <Link
            href={`/teacher/classes/${classId}/attendance`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            الحضور ({classSection._count.attendanceSessions})
          </Link>
        </div>
      </div>

      <RankingTable classId={classId} ranking={ranking} />

      <WeightsEditor classSection={classSection} />

      <RosterManager classId={classId} initialStudents={classSection.students} />
    </div>
  );
}
