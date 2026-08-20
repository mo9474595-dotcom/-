import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ProjectGradingClient from "./ProjectGradingClient";

export default async function ProjectGradingPage({
  params,
}: {
  params: Promise<{ classId: string; projectId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { classId, projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { classSection: true },
  });
  if (!project || project.classSection.teacherId !== teacherId || project.classSectionId !== classId) {
    notFound();
  }

  const [students, grades] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { classSectionId: classId },
      orderBy: { fullName: "asc" },
    }),
    prisma.projectGrade.findMany({ where: { projectId } }),
  ]);
  const gradeByStudent = new Map(grades.map((g) => [g.studentProfileId, g]));
  const rows = students.map((s) => ({ student: s, grade: gradeByStudent.get(s.id) ?? null }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-dark">تصحيح: {project.title}</h1>
      <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
      <p className="mt-2 text-sm text-slate-500">الدرجة القصوى: {project.maxScore}</p>
      <ProjectGradingClient projectId={projectId} maxScore={project.maxScore} initialRows={rows} />
    </div>
  );
}
