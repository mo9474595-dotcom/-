import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId } = await params;

  const classSection = await prisma.classSection.findUnique({ where: { id: classId } });
  if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) notFound();

  const projects = await prisma.project.findMany({
    where: { classSectionId: classId },
    orderBy: { createdAt: "desc" },
    include: { grades: { select: { score: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">مشاريع {classSection.name}</h1>
      <ProjectsClient classId={classId} initialProjects={projects} />
    </div>
  );
}
