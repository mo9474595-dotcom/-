import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedStudent } from "@/lib/exams";
import { studentSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ studentId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { studentId } = await params;
    await getOwnedStudent(teacherId, studentId);

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        classSection: true,
        manualGrades: { orderBy: { gradedAt: "desc" } },
        projectGrades: { include: { project: true } },
        attendanceRecords: { include: { session: true } },
        examCodes: {
          include: { exam: { select: { title: true } }, attempt: true },
        },
      },
    });

    return NextResponse.json({ student });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { studentId } = await params;
    await getOwnedStudent(teacherId, studentId);

    const body = await req.json().catch(() => null);
    const parsed = studentSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        ...(parsed.data.fullName !== undefined ? { fullName: parsed.data.fullName } : {}),
        ...(parsed.data.studentRef !== undefined
          ? { studentRef: parsed.data.studentRef || null }
          : {}),
      },
    });

    return NextResponse.json({ student });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { studentId } = await params;
    await getOwnedStudent(teacherId, studentId);

    await prisma.studentProfile.delete({ where: { id: studentId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
