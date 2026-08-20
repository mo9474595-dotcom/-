import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedClassSection } from "@/lib/exams";
import { classSectionSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const classSection = await prisma.classSection.findUnique({
      where: { id: classId },
      include: {
        students: { orderBy: { fullName: "asc" } },
        projects: { orderBy: { createdAt: "desc" } },
        attendanceSessions: { orderBy: { date: "desc" } },
      },
    });

    return NextResponse.json({ classSection });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const body = await req.json().catch(() => null);
    const parsed = classSectionSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const classSection = await prisma.classSection.update({
      where: { id: classId },
      data: parsed.data,
    });

    return NextResponse.json({ classSection });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    await prisma.classSection.delete({ where: { id: classId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
