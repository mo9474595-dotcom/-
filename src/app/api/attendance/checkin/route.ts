import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { selfCheckinSchema } from "@/lib/validation";
import { rateLimitOrResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "attendance-checkin", 15, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = selfCheckinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { selfCheckinCode: parsed.data.code.toUpperCase() },
  });
  if (!session) {
    return NextResponse.json({ error: "رمز غير صالح" }, { status: 404 });
  }

  const now = Date.now();
  const isOpen =
    session.selfCheckinOpensAt != null &&
    session.selfCheckinClosesAt != null &&
    now >= session.selfCheckinOpensAt.getTime() &&
    now <= session.selfCheckinClosesAt.getTime();
  if (!isOpen) {
    return NextResponse.json({ error: "انتهت صلاحية رمز الحضور" }, { status: 410 });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: parsed.data.studentProfileId },
  });
  if (!student || student.classSectionId !== session.classSectionId) {
    return NextResponse.json({ error: "الطالب غير موجود في هذه الشعبة" }, { status: 400 });
  }

  // If a record already exists (teacher-set or an earlier check-in), leave
  // it as-is rather than letting a repeat check-in overwrite it.
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      sessionId_studentProfileId: {
        sessionId: session.id,
        studentProfileId: student.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ status: existing.status, alreadyMarked: true });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      sessionId: session.id,
      studentProfileId: student.id,
      status: "PRESENT",
      markedBySelf: true,
    },
  });

  return NextResponse.json({ status: record.status, alreadyMarked: false });
}
