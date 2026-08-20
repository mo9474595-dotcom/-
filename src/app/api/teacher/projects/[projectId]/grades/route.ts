import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedProject } from "@/lib/exams";
import { projectGradeSchema } from "@/lib/validation";
import { z } from "zod";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { projectId } = await params;
    const project = await getOwnedProject(teacherId, projectId);

    const [students, grades] = await Promise.all([
      prisma.studentProfile.findMany({
        where: { classSectionId: project.classSectionId },
        orderBy: { fullName: "asc" },
      }),
      prisma.projectGrade.findMany({ where: { projectId } }),
    ]);
    const gradeByStudent = new Map(grades.map((g) => [g.studentProfileId, g]));

    const rows = students.map((s) => ({
      student: s,
      grade: gradeByStudent.get(s.id) ?? null,
    }));

    return NextResponse.json({ project, rows });
  } catch (err) {
    return handleApiError(err);
  }
}

const upsertSchema = projectGradeSchema.extend({
  studentProfileId: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { projectId } = await params;
    const project = await getOwnedProject(teacherId, projectId);

    const body = await req.json().catch(() => null);
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: parsed.data.studentProfileId },
    });
    if (!student || student.classSectionId !== project.classSectionId) {
      return NextResponse.json({ error: "الطالب غير موجود في هذه الشعبة" }, { status: 400 });
    }

    const score =
      parsed.data.score != null ? Math.min(parsed.data.score, project.maxScore) : null;

    const grade = await prisma.projectGrade.upsert({
      where: {
        projectId_studentProfileId: {
          projectId,
          studentProfileId: parsed.data.studentProfileId,
        },
      },
      create: {
        projectId,
        studentProfileId: parsed.data.studentProfileId,
        score,
        feedback: parsed.data.feedback || null,
        gradedAt: score != null ? new Date() : null,
      },
      update: {
        score,
        feedback: parsed.data.feedback || null,
        gradedAt: score != null ? new Date() : null,
      },
    });

    return NextResponse.json({ grade });
  } catch (err) {
    return handleApiError(err);
  }
}
