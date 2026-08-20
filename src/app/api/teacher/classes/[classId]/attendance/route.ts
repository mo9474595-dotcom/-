import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedClassSection } from "@/lib/exams";
import { attendanceSessionSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ classId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const body = await req.json().catch(() => ({}));
    const parsed = attendanceSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const session = await prisma.attendanceSession.create({
      data: {
        classSectionId: classId,
        title: parsed.data.title || null,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
