import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { computeClassRanking } from "@/lib/ranking";
import RosterManager from "./RosterManager";
import WeightsEditor from "./WeightsEditor";
import RankingTable from "./RankingTable";
import DeleteClassButton from "./DeleteClassButton";
import Icon from "@/components/brand/Icon";

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
  if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) notFound();

  const ranking = await computeClassRanking(classId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/teacher/classes/${classId}/export`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="cloud" size={16} />
            تصدير الدرجات (CSV)
          </a>
          <a
            href={`/api/teacher/classes/${classId}/report`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="clipboard" size={16} />
            تقرير أداء (PowerPoint)
          </a>
          <Link
            href={`/teacher/classes/${classId}/attendance`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="calendarCheck" size={16} />
            الحضور ({classSection._count.attendanceSessions})
          </Link>
          <Link
            href={`/teacher/classes/${classId}/projects`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="folder" size={16} />
            المشاريع ({classSection._count.projects})
          </Link>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-3">
            <h1 className="text-2xl font-bold text-brand-navy-dark">{classSection.name}</h1>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
              <Icon name="clipboard" size={18} />
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">شعبة جديدة</p>
          <DeleteClassButton classId={classId} />
        </div>
      </div>

      <RankingTable classId={classId} ranking={ranking} />

      <WeightsEditor classSection={classSection} />

      <RosterManager classId={classId} initialStudents={classSection.students} />
    </div>
  );
}
