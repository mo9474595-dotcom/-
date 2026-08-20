import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttendanceSession } from "@/lib/exams";
import { attendanceRecordSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { sessionId } = await params;
    const session = await getOwnedAttendanceSession(teacherId, sessionId);

    const body = await req.json().catch(() => null);
    const parsed = attendanceRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: parsed.data.studentProfileId },
    });
    if (!student || student.classSectionId !== session.classSectionId) {
      return NextResponse.json({ error: "الطالب غير موجود في هذه الشعبة" }, { status: 400 });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentProfileId: {
          sessionId,
          studentProfileId: parsed.data.studentProfileId,
        },
      },
      create: {
        sessionId,
        studentProfileId: parsed.data.studentProfileId,
        status: parsed.data.status,
        markedBySelf: false,
      },
      update: { status: parsed.data.status, markedBySelf: false },
    });

    return NextResponse.json({ record });
  } catch (err) {
    return handleApiError(err);
  }
}
