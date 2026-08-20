import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedClassSection } from "@/lib/exams";
import { bulkStudentsSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const students = await prisma.studentProfile.findMany({
      where: { classSectionId: classId },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json({ students });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const body = await req.json().catch(() => null);
    const parsed = bulkStudentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    await prisma.studentProfile.createMany({
      data: parsed.data.students.map((s) => ({
        classSectionId: classId,
        fullName: s.fullName,
        studentRef: s.studentRef || null,
      })),
    });

    const students = await prisma.studentProfile.findMany({
      where: { classSectionId: classId },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ students }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
