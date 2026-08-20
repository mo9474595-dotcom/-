import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { code } = await params;

  const session = await prisma.attendanceSession.findUnique({
    where: { selfCheckinCode: code.toUpperCase() },
    include: { classSection: { select: { id: true, name: true } } },
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

  const students = await prisma.studentProfile.findMany({
    where: { classSectionId: session.classSectionId },
    select: { id: true, fullName: true, studentRef: true },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({
    session: { id: session.id, title: session.title, date: session.date },
    className: session.classSection.name,
    students,
  });
}
