import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { classSectionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const classes = await prisma.classSection.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { students: true, projects: true, attendanceSessions: true } },
      },
    });
    return NextResponse.json({ classes });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();
    const body = await req.json().catch(() => null);
    const parsed = classSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const classSection = await prisma.classSection.create({
      data: { ...parsed.data, teacherId },
    });

    return NextResponse.json({ classSection }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
