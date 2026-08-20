import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

// There's no hosting-level automated backup for this app (self-hosted,
// no cloud storage configured), so this gives the teacher a manual
// safety net: a full JSON dump of everything they own, on demand.
export async function GET() {
  try {
    const teacherId = await requireTeacherId();

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

    const payload = {
      exportedAt: new Date().toISOString(),
      teacher,
      classSections,
      exams,
    };

    const filename = `نسخة-احتياطية-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
