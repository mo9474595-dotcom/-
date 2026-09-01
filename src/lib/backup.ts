import { prisma } from "@/lib/prisma";

// Shared by the on-demand manual export and the scheduled automatic backup
// cron job, so both produce the exact same shape.
export async function buildTeacherBackupPayload(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { name: true, email: true, createdAt: true },
  });

  const [classSections, exams] = await Promise.all([
    prisma.classSection.findMany({
      where: { teacherId },
      include: {
        students: {
          include: {
            manualGrades: true,
            projectGrades: { include: { project: { select: { title: true, maxScore: true } } } },
            attendanceRecords: { include: { session: { select: { date: true, title: true } } } },
          },
        },
        projects: true,
        attendanceSessions: true,
      },
    }),
    prisma.exam.findMany({
      where: { teacherId },
      include: {
        questions: { include: { choices: true }, orderBy: { order: "asc" } },
        codes: true,
        attempts: { include: { answers: true } },
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    teacher,
    classSections,
    exams,
  };
}
