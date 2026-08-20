import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttendanceSession } from "@/lib/exams";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { sessionId } = await params;
    const session = await getOwnedAttendanceSession(teacherId, sessionId);

    const [students, records] = await Promise.all([
      prisma.studentProfile.findMany({
        where: { classSectionId: session.classSectionId },
        orderBy: { fullName: "asc" },
      }),
      prisma.attendanceRecord.findMany({ where: { sessionId } }),
    ]);
    const recordByStudent = new Map(records.map((r) => [r.studentProfileId, r]));

    const rows = students.map((s) => ({
      student: s,
      record: recordByStudent.get(s.id) ?? null,
    }));

    return NextResponse.json({ session, rows });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { sessionId } = await params;
    await getOwnedAttendanceSession(teacherId, sessionId);

    await prisma.attendanceSession.delete({ where: { id: sessionId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
